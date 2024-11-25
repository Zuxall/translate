import React from 'react';
import { Download } from 'lucide-react';

interface TranslationResultsProps {
  transcription: string;
  translation: string;
}

const TranslationResults: React.FC<TranslationResultsProps> = ({ transcription, translation }) => {
  const downloadTranslation = () => {
    const element = document.createElement('a');
    const file = new Blob(
      [`Transcription (Japonais):\n${transcription}\n\nTraduction (Français):\n${translation}`],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = 'traduction.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!transcription && !translation) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Transcription (Japonais)
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">{transcription}</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Traduction (Français)
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">{translation}</p>
        </div>
      </div>

      {translation && (
        <div className="flex justify-center mt-8">
          <button
            onClick={downloadTranslation}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Télécharger la traduction
          </button>
        </div>
      )}
    </>
  );
};

export default TranslationResults;