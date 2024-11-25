import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface VideoUploaderProps {
  videoFile: File | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ videoFile, onFileUpload }) => {
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1024) { // 1GB
        setError('La taille du fichier ne doit pas dépasser 1GB');
        return;
      }
      setError('');
      onFileUpload(event);
    }
  };

  return (
    <div className="mb-8">
      <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors">
        <Upload className="w-12 h-12 text-indigo-500 mb-2" />
        <span className="text-indigo-600 font-medium text-center">
          {videoFile ? videoFile.name : 'Cliquez pour télécharger une vidéo'}
          <br />
          <span className="text-sm text-gray-500">
            (Taille maximale : 1GB)
          </span>
        </span>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      
      {error && (
        <div className="mt-2 flex items-center text-red-600">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;