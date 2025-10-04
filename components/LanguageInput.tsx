import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, SparklesIcon, TranslateIcon, MicrophoneIcon } from './icons';

// Fix: Add TypeScript type definitions for the Web Speech API to fix errors.
interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onstart: (() => void) | null;
    onresult: ((event: any) => void) | null; // Using any for event for simplicity
    onerror: ((event: any) => void) | null; // Using any for event for simplicity
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

// Polyfill for cross-browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textBeforeRecording = useRef('');

  useEffect(() => {
    if (!SpeechRecognition) {
      setSpeechError('La API de reconocimiento de voz no es compatible con este navegador.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true; // Show results as they are captured
    recognition.continuous = true; // Keep listening until stopped

    recognition.onstart = () => {
      setIsRecording(true);
      setSpeechError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const fullTranscript = (textBeforeRecording.current ? textBeforeRecording.current + ' ' : '') + finalTranscript + interimTranscript;
      setText(fullTranscript.trim());
    };

    recognition.onerror = (event) => {
      setSpeechError(`Error de reconocimiento: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = recognition;

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, []);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      // Greet the user to let them know recording has started
      const greeting = new SpeechSynthesisUtterance('Hola');
      greeting.lang = 'es-ES';
      greeting.onend = () => {
          textBeforeRecording.current = text; // Save text before recording starts
          recognitionRef.current?.start();
      };
      // Cancel any ongoing speech synthesis
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(greeting);
    }
  };


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
        placeholder="Escribe una frase, habla al micrófono, pega un párrafo o sube una imagen..."
        className="w-full flex-grow bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 resize-none min-h-[250px] text-base"
        disabled={isLoading}
      />
      {speechError && <p className="text-red-400 text-sm mt-2">{speechError}</p>}
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
                onClick={handleToggleRecording}
                disabled={isLoading || !!speechError}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-green-600 hover:bg-green-700'} text-white`}
                aria-label={isRecording ? 'Dejar de grabar' : 'Empezar a grabar'}
            >
                <MicrophoneIcon className="h-5 w-5" />
                {isRecording ? 'Detener' : 'Hablar'}
            </button>
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
