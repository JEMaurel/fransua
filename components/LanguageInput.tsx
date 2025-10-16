import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, SparklesIcon, TranslateIcon, MicrophoneIcon } from './icons';

interface LanguageInputProps {
  onTranslate: (text: string) => void;
  onGenerateAndTranslate: (theme?: string) => Promise<string>;
  onImageUpload: (file: File) => Promise<string>;
  isLoading: boolean;
}

// Add SpeechRecognition types for cross-browser compatibility
interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onstart: (() => void) | null;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}
interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}
declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;


export const LanguageInput: React.FC<LanguageInputProps> = ({ onTranslate, onGenerateAndTranslate, onImageUpload, isLoading }) => {
  const [text, setText] = useState('');
  const [storyTheme, setStoryTheme] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Check for browser support and cleanup on unmount
  useEffect(() => {
    if (!SpeechRecognition) {
      setSpeechError('El reconocimiento de voz no es compatible con este navegador.');
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleTranslateClick = () => {
    onTranslate(text);
  };
  
  const handleGenerateAndTranslateClick = async () => {
    const story = await onGenerateAndTranslate(storyTheme || undefined);
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

  const handleToggleRecording = () => {
    if (isRecording) {
        recognitionRef.current?.stop();
        return;
    }

    if (!SpeechRecognition) {
        return; // Error is already set by useEffect
    }

    // Create a new recognition instance for each recording session
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
        setText('');
        onTranslate(''); // Clear previous translation
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        setText(transcript);
    };

    recognition.onerror = (event) => {
        if (event.error !== 'aborted') {
            setSpeechError(`Error de reconocimiento: ${event.error}`);
        }
        setIsRecording(false);
        recognitionRef.current = null;
    };

    recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-white mb-4">Texto en Español</h2>
      {speechError && <p className="text-red-400 text-sm mb-2">{speechError}</p>}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe una frase, habla al micrófono, o sube una imagen..."
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
            onClick={handleGenerateAndTranslateClick}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            <SparklesIcon />
            Generar Historia y Traducir
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
                onClick={handleToggleRecording}
                disabled={isLoading || !!speechError}
                aria-label={isRecording ? 'Detener grabación' : 'Grabar voz'}
                className={`w-full sm:w-auto flex-shrink-0 flex items-center justify-center p-3 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
                <MicrophoneIcon className="h-6 w-6 text-white"/>
            </button>
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