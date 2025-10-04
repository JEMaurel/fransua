
import React, { useState, useRef } from 'react';
import { UploadIcon, SparklesIcon, TranslateIcon } from './icons';

interface LanguageInputProps {
  onTranslate: (text: string) => void;
  onGenerateStory: (theme?: string) => Promise<string>;
  onImageUpload: (file: File) => Promise<string>;
  isLoading: boolean;
}

export const LanguageInput: React.FC<LanguageInputProps> = ({ onTranslate, onGenerateStory, onImageUpload, isLoading }) => {
  const [text, setText] = useState('');
  const [storyTheme, setStoryTheme] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranslateClick = () => {
    onTranslate(text);
  };
  
  const handleGenerateStory = async () => {
    const story = await onGenerateStory(storyTheme || undefined);
    setText(story);
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const extractedText = await onImageUpload(file);
      setText(extractedText);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-white mb-4">Texto en Español</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe una frase, pega un párrafo o sube una imagen..."
        className="w-full flex-grow bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 resize-none min-h-[250px] text-base"
        disabled={isLoading}
      />
      <div className="mt-4 space-y-4">
         <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={storyTheme}
            onChange={(e) => setStoryTheme(e.target.value)}
            placeholder="Tema opcional (ej. en un café)"
            className="w-full sm:w-auto flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
            disabled={isLoading}
          />
          <button 
            onClick={handleGenerateStory}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            <SparklesIcon />
            Generar Historia
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <button 
                onClick={handleUploadClick}
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <UploadIcon />
                Subir Imagen
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                className="hidden"
                accept="image/*"
            />
            <button
                onClick={handleTranslateClick}
                disabled={isLoading || !text.trim()}
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg transform hover:scale-105"
            >
               <TranslateIcon />
               {isLoading ? 'Traduciendo...' : 'Traducir'}
            </button>
        </div>
      </div>
    </div>
  );
};
