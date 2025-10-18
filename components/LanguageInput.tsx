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

const beepSound = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU0AAAAAAAA/D/4//z8//wEACQEF//8A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/QD+AP0A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/QD+AP0A/gD9AP4A/QD+AP0A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/gD9AP4A/";

const LanguageInputComponent: React.ForwardRefRenderFunction<LanguageInputRef, LanguageInputProps> = (
  { text, onTextChange, onTranslate, onGenerateAndTranslate, onImageUpload, onResetChat, onModifyText, isLoading, hasTranslation },
  ref
) => {
  const [theme, setTheme] = useState('');
  const [modifyInstruction, setModifyInstruction] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isModifyListening, setIsModifyListening] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const modifyRecognitionRef = useRef<SpeechRecognition | null>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Auto-focus the textarea when the component mounts
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    beepAudioRef.current = new Audio(beepSound);
  }, []);

  useImperativeHandle(ref, () => ({
    focusAndSelect: () => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    },
  }));

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      onTextChange(Array.from(event.results).map(r => r[0].transcript).join(''));
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleToggleModifyListening = () => {
    if (isModifyListening) {
      modifyRecognitionRef.current?.stop();
      return;
    }

    if (!SpeechRecognition) return;

    beepAudioRef.current?.play();
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.onstart = () => setIsModifyListening(true);
    recognition.onend = () => setIsModifyListening(false);
    recognition.onresult = (event) => {
      setModifyInstruction(Array.from(event.results).map(r => r[0].transcript).join(''));
    };
    recognition.start();
    modifyRecognitionRef.current = recognition;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleTranslateClick = () => onTranslate(text);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslateClick();
    }
  };
  
  const handleModify = () => {
    if(text && modifyInstruction) {
        onModifyText(text, modifyInstruction);
        setModifyInstruction('');
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Texto en Español</h2>
          <button 
            onClick={() => imageInputRef.current?.click()} 
            disabled={isLoading} 
            className="p-2 rounded-full text-gray-400 bg-gray-700/60 hover:bg-gray-700 transition-colors disabled:opacity-50" 
            aria-label="Subir imagen"
          >
              <UploadIcon className="w-5 h-5" />
          </button>
          <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" hidden />
        </div>
        <button onClick={onResetChat} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors p-2 rounded-md -mr-2">
          <NewChatIcon /> Nueva Conversación
        </button>
      </div>

      <div className="relative flex-grow">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[150px] bg-gray-900/70 border border-gray-600 rounded-lg p-4 pr-20 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none overflow-y-hidden"
          placeholder="Escribe el texto a traducir o usa el micrófono..."
          disabled={isLoading}
        />
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          {text && (
            <button onClick={() => onTextChange('')} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors" aria-label="Limpiar texto">
              <ClearIcon className="w-4 h-4 text-gray-400"/>
            </button>
          )}
          <button onClick={handleToggleListening} className={`p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-300'}`} aria-label="Grabar voz">
            <MicrophoneIcon className="w-5 h-5"/>
          </button>
        </div>
      </div>
      
      <button onClick={handleTranslateClick} disabled={isLoading || !text.trim()} className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
        <TranslateIcon />
        <span>{isLoading ? 'Traduciendo...' : 'Traducir'}</span>
      </button>

      <div className="grid grid-cols-1 gap-3">
        <div className="flex rounded-md shadow-sm">
            <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Tema para la historia (opcional)" className="flex-1 block w-full rounded-none rounded-l-md bg-gray-700 border-gray-600 text-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
            <button onClick={() => onGenerateAndTranslate(theme)} disabled={isLoading} className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-600 bg-gray-700 rounded-r-md text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50 gap-2">
                <SparklesIcon /> Generar
            </button>
        </div>
      </div>

      <div className="border-t border-gray-700/50 pt-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300">Interactuar con la IA</h3>
        <p className="text-xs text-gray-500">Pide cambios al texto original (ej. "hazlo más formal", "cambia 'coche' por 'carro'").</p>
        <div className="relative flex items-center">
            <input 
                type="text" 
                value={modifyInstruction}
                onChange={(e) => setModifyInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleModify()}
                placeholder="Tu instrucción aquí..."
                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pr-20 text-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 <button onClick={handleToggleModifyListening} className={`p-1.5 rounded-full hover:bg-gray-600 transition-colors ${isModifyListening ? 'text-red-500 animate-pulse' : 'text-gray-300'}`} aria-label="Grabar instrucción">
                    <MicrophoneIcon className="w-5 h-5"/>
                </button>
                <button onClick={handleModify} disabled={!modifyInstruction.trim() || isLoading} className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 transition-colors" aria-label="Enviar instrucción">
                    <SendIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default forwardRef(LanguageInputComponent);