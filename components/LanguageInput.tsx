import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { UploadIcon, SparklesIcon, TranslateIcon, MicrophoneIcon, ClearIcon, NewChatIcon, SendIcon } from './icons';

interface LanguageInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onTranslate: (text: string) => void;
  onGenerateAndTranslate: (theme?: string) => Promise<void>;
  onImageUpload: (file: File) => Promise<void>;
  onResetChat: () => void;
  onModifyText: (baseText: string, instruction: string) => void;
  isLoading: boolean;
  hasTranslation: boolean;
}

export interface LanguageInputRef {
  focusAndSelect: () => void;
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


export const LanguageInput = forwardRef<LanguageInputRef, LanguageInputProps>(({ 
  text, 
  onTextChange, 
  onTranslate, 
  onGenerateAndTranslate, 
  onImageUpload, 
  onResetChat, 
  onModifyText,
  isLoading, 
  hasTranslation 
}, ref) => {
  const [storyTheme, setStoryTheme] = useState('');
  const [followUp, setFollowUp] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fix: Corrected typo in useImperativeHandle hook name.
  useImperativeHandle(ref, () => ({
    focusAndSelect: () => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }));


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
    await onGenerateAndTranslate(storyTheme || undefined);
    setFollowUp('');
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onImageUpload(file);
      setFollowUp('');
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

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = true; // Allow for pauses

    let finalTranscript = '';

    recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
        onTextChange('');
        onTranslate(''); 
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        onTextChange(finalTranscript + interimTranscript);
    };
    
    recognition.onerror = (event) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            setSpeechError(`Error de reconocimiento: ${event.error}`);
        }
        setIsRecording(false);
        recognitionRef.current = null;
    };

    recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
        if (finalTranscript.trim()) {
          onTextChange(finalTranscript.trim());
          onTranslate(finalTranscript.trim());
        }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };
  
  const handleClearClick = () => {
    onTextChange('');
    onTranslate('');
  };

  const handleNewChatClick = () => {
    onResetChat();
    setFollowUp('');
  };

  const handleFollowUpSubmit = () => {
    if (!followUp.trim() || !text.trim()) return;
    onModifyText(text, followUp);
    setFollowUp('');
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Texto en Español</h2>
        </div>
         <button 
            onClick={handleNewChatClick}
            disabled={isLoading}
            className="flex-shrink-0 flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Empezar una nueva conversación de traducción"
          >
            <NewChatIcon />
            Nuevo Chat
          </button>
      </div>
      {speechError && <p className="text-red-400 text-sm mb-2">{speechError}</p>}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Escribe, habla, sube una imagen o genera una historia..."
        className="w-full flex-grow bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 resize-none min-h-[200px] text-base"
        disabled={isLoading}
      />

      {hasTranslation && (
        <div className="mt-4">
          <label htmlFor="follow-up-input" className="block text-sm font-medium text-gray-400 mb-2">
            Modificar Texto en Español
          </label>
          <div className="flex items-center gap-2">
            <input
              id="follow-up-input"
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Ej: 'conjuga ese verbo' o 'hazlo más formal'"
              className="w-full flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFollowUpSubmit();
                }
              }}
            />
            <button
              onClick={handleFollowUpSubmit}
              disabled={isLoading || !followUp.trim() || !text.trim()}
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2.5 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Modificar el texto en español"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
      
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
            Generar y Traducir
          </button>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleUploadClick}
                disabled={isLoading}
                className="p-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                 aria-label="Subir Imagen"
            >
                <UploadIcon />
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
                className={`p-3 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
                <MicrophoneIcon className="h-6 w-6 text-white"/>
            </button>
             <button
                onClick={handleClearClick}
                disabled={isLoading || !text.trim()}
                aria-label="Limpiar texto"
                className="p-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ClearIcon className="h-6 w-6 text-white"/>
            </button>
            <button
                onClick={handleTranslateClick}
                disabled={isLoading || !text.trim()}
                className="w-full flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg transform hover:scale-105"
            >
               <TranslateIcon />
               {isLoading ? 'Procesando...' : 'Traducir'}
            </button>
        </div>
      </div>
    </div>
  );
});