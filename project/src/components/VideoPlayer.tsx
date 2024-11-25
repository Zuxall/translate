import React from 'react';
import { Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoRef, isPlaying, setIsPlaying }) => {
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative mb-8">
      <video
        ref={videoRef}
        className="w-full rounded-lg"
        controls={false}
      >
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
      <button
        onClick={togglePlayPause}
        className="absolute bottom-4 left-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100"
      >
        {isPlaying ? 
          <Pause className="w-6 h-6 text-indigo-600" /> : 
          <Play className="w-6 h-6 text-indigo-600" />
        }
      </button>
    </div>
  );
};

export default VideoPlayer;