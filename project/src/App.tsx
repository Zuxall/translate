import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Languages, Download, Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VideoPlayer from './components/VideoPlayer';
import TranslationResults from './components/TranslationResults';
import VideoUploader from './components/VideoUploader';
import { uploadLargeVideo } from './services/api';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const videoUrl = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
      }
      setTranscription('');
      setTranslation('');
      setUploadProgress(0);
    }
  };

  const processVideo = async () => {
    if (!videoFile) {
      toast.error('Veuillez d\'abord télécharger une vidéo');
      return;
    }

    setIsProcessing(true);
    try {
      await uploadLargeVideo(
        videoFile,
        (progress) => {
          setUploadProgress(progress);
        },
        (response) => {
          setTranscription(response.transcription);
          setTranslation(response.translation);
          toast.success('Traduction terminée avec succès!');
          setIsProcessing(false);
        },
        (error) => {
          console.error('Processing error:', error);
          toast.error('Une erreur est survenue lors du traitement');
          setIsProcessing(false);
        }
      );
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Une erreur est survenue lors du traitement');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-900 mb-4">
            Traducteur Vidéo Japonais-Français
          </h1>
          <p className="text-lg text-gray-600">
            Téléchargez une vidéo en japonais pour obtenir sa traduction en français
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <VideoUploader
            videoFile={videoFile}
            onFileUpload={handleFileUpload}
          />

          {videoFile && (
            <>
              <VideoPlayer
                videoRef={videoRef}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
              />

              <div className="flex flex-col items-center mb-8">
                <button
                  onClick={processVideo}
                  disabled={isProcessing}
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {uploadProgress < 100 
                        ? `Téléchargement: ${uploadProgress}%`
                        : 'Traitement en cours...'}
                    </>
                  ) : (
                    <>
                      <Languages className="w-5 h-5 mr-2" />
                      Traduire la vidéo
                    </>
                  )}
                </button>
                
                {isProcessing && uploadProgress < 100 && (
                  <div className="w-full max-w-xs mt-4">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <TranslationResults
                transcription={transcription}
                translation={translation}
              />
            </>
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;