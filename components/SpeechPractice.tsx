import React, { useState, useEffect, useRef } from 'react';
import { translateText } from '../services/geminiService';
import { MicrophoneIcon } from './icons';

// Fix: Add TypeScript type definitions for the Web Speech API to fix errors.
// This resolves errors about SpeechRecognition not existing on `window` and allows for strong typing.
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

export const SpeechPractice: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [translation, setTranslation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const wasRecordingRef = useRef(false);

    useEffect(() => {
        if (!SpeechRecognition) {
            setError('La API de reconocimiento de voz no es compatible con este navegador.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
            setIsRecording(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = 0; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPart + ' ';
                } else {
                    interimTranscript = transcriptPart;
                }
            }
            setTranscript((finalTranscript + interimTranscript).trim());
        };

        recognition.onerror = (event) => {
            setError(`Error de reconocimiento: ${event.error}`);
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

    const handleTranslateTranscript = async (textToTranslate: string) => {
        if (!textToTranslate) return;
        setIsLoading(true);
        try {
            const spanishTranslation = await translateText(textToTranslate, 'Francés', 'Español');
            setTranslation(spanishTranslation);
        } catch (err) {
            setError('No se pudo traducir el texto.');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (wasRecordingRef.current && !isRecording && transcript.trim()) {
            handleTranslateTranscript(transcript.trim());
        }
        wasRecordingRef.current = isRecording;
    }, [isRecording, transcript]);


    const handleToggleRecording = () => {
        if (!recognitionRef.current) return;

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setTranscript('');
            setTranslation('');
            setError(null);
            
            const greeting = new SpeechSynthesisUtterance('Bonjour');
            greeting.lang = 'fr-FR';
            greeting.onend = () => {
                recognitionRef.current?.start();
            };
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(greeting);
        }
    };
    
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Práctica de Pronunciación</h2>
            <p className="text-sm text-gray-400 mb-6">Presiona el micrófono y habla en francés. La IA transcribirá y traducirá tu voz al español para que puedas verificar tu pronunciación.</p>
            
            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={handleToggleRecording}
                    disabled={!!error}
                    className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    aria-label={isRecording ? 'Dejar de grabar' : 'Empezar a grabar'}
                >
                    <MicrophoneIcon />
                </button>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                {(isRecording || transcript || isLoading || translation) && (
                    <div className="w-full bg-gray-900/70 rounded-lg p-4 border border-gray-600 mt-4 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-1">Tu voz (Francés):</h3>
                            <p className="text-lg text-blue-300 min-h-[28px]">{transcript || (isRecording ? 'Escuchando...' : '...')}</p>
                        </div>
                        <div className="border-t border-gray-700"></div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-1">Traducción (Español):</h3>
                            {isLoading ? (
                                <p className="text-lg text-gray-200">Traduciendo...</p>
                            ) : (
                                <p className="text-lg text-gray-200 min-h-[28px]">{translation || '...'}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};