import axios from 'axios';
import Resumable from 'resumablejs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CHUNK_SIZE = 1024 * 1024 * 10; // 10MB chunks

export const uploadLargeVideo = (
  file: File, 
  onProgress: (progress: number) => void,
  onSuccess: (response: any) => void,
  onError: (error: Error) => void
) => {
  const resumable = new Resumable({
    target: `${API_URL}/api/upload-chunk`,
    chunkSize: CHUNK_SIZE,
    simultaneousUploads: 3,
    testChunks: false,
    headers: {
      'X-File-Size': file.size.toString(),
    }
  });

  resumable.addFile(file);

  resumable.on('fileProgress', (file: any) => {
    onProgress(Math.floor(file.progress() * 100));
  });

  resumable.on('fileSuccess', async (file: any, response: string) => {
    try {
      const result = JSON.parse(response);
      const translationResponse = await axios.post(`${API_URL}/api/process-video`, {
        fileId: result.fileId
      });
      onSuccess(translationResponse.data);
    } catch (error) {
      onError(error as Error);
    }
  });

  resumable.on('fileError', (_: any, message: string) => {
    onError(new Error(message));
  });

  resumable.upload();
};