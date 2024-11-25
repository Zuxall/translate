import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import ffmpeg from 'ffmpeg-static';
import axios from 'axios';
import { Readable } from 'stream';
import { Model, KaldiRecognizer } from 'vosk';
import { createWriteStream, createReadStream, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

const CHUNK_SIZE = 1024 * 1024 * 10; // 10MB chunks
const activeUploads = new Map();

app.post('/api/upload-chunk', upload.single('file'), async (req, res) => {
  const { 'x-file-size': totalSize } = req.headers;
  const { resumableChunkNumber, resumableTotalChunks, resumableIdentifier } = req.body;
  
  try {
    const chunkNumber = parseInt(resumableChunkNumber);
    const totalChunks = parseInt(resumableTotalChunks);
    
    if (!activeUploads.has(resumableIdentifier)) {
      activeUploads.set(resumableIdentifier, {
        chunks: new Set(),
        outputPath: join(uploadsDir, `${resumableIdentifier}.mp4`)
      });
    }
    
    const upload = activeUploads.get(resumableIdentifier);
    const chunkPath = join(uploadsDir, `${resumableIdentifier}-${chunkNumber}`);
    
    // Save chunk
    await new Promise((resolve, reject) => {
      createReadStream(req.file.path)
        .pipe(createWriteStream(chunkPath))
        .on('finish', resolve)
        .on('error', reject);
    });
    
    upload.chunks.add(chunkNumber);
    
    // Check if all chunks are uploaded
    if (upload.chunks.size === totalChunks) {
      // Merge chunks
      const writeStream = createWriteStream(upload.outputPath);
      
      for (let i = 1; i <= totalChunks; i++) {
        const chunkPath = join(uploadsDir, `${resumableIdentifier}-${i}`);
        await new Promise((resolve) => {
          createReadStream(chunkPath)
            .pipe(writeStream, { end: i === totalChunks })
            .on('finish', () => {
              unlinkSync(chunkPath);
              resolve();
            });
        });
      }
      
      activeUploads.delete(resumableIdentifier);
      res.json({ fileId: resumableIdentifier });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({ error: 'Failed to process chunk' });
  }
});

// Initialize Vosk model
const VOSK_MODEL_PATH = './model';
const model = new Model(VOSK_MODEL_PATH);

async function convertVideoToAudio(videoPath) {
  const outputPath = videoPath.replace('.mp4', '.wav');
  
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpeg, [
      '-i', videoPath,
      '-ar', '16000',
      '-ac', '1',
      '-f', 'wav',
      outputPath
    ]);

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
}

async function transcribeAudio(audioPath) {
  const rec = new KaldiRecognizer(model, 16000);
  rec.setWords(true);

  let finalResult = '';
  const audioStream = createReadStream(audioPath);
  
  for await (const chunk of audioStream) {
    if (rec.acceptWaveform(chunk)) {
      const result = JSON.parse(rec.result());
      if (result.text) {
        finalResult += result.text + ' ';
      }
    }
  }
  
  const result = JSON.parse(rec.finalResult());
  if (result.text) {
    finalResult += result.text;
  }
  
  return finalResult.trim();
}

async function translateText(text) {
  try {
    const response = await axios.post('https://libretranslate.de/translate', {
      q: text,
      source: 'ja',
      target: 'fr',
      format: 'text'
    });
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate text');
  }
}

app.post('/api/process-video', async (req, res) => {
  const { fileId } = req.body;
  const videoPath = join(uploadsDir, `${fileId}.mp4`);

  try {
    if (!existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const audioPath = await convertVideoToAudio(videoPath);
    const transcription = await transcribeAudio(audioPath);
    const translation = await translateText(transcription);

    // Cleanup
    unlinkSync(videoPath);
    unlinkSync(audioPath);

    res.json({
      transcription,
      translation
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erreur lors du traitement de la vidéo' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});