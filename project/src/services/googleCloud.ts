import { SpeechClient } from '@google-cloud/speech';
import { Translate } from '@google-cloud/translate/build/src/v2';

const speechClient = new SpeechClient();
const translate = new Translate();

export const transcribeAudio = async (audioBuffer: ArrayBuffer): Promise<string> => {
  const audioBytes = new Uint8Array(audioBuffer).toString();
  
  const audio = {
    content: audioBytes,
  };
  
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'ja-JP',
  };
  
  const request = {
    audio: audio,
    config: config,
  };

  try {
    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n');
    return transcription || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
};

export const translateText = async (text: string): Promise<string> => {
  try {
    const [translation] = await translate.translate(text, {
      from: 'ja',
      to: 'fr',
    });
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate text');
  }
};