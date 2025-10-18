import React, { useState, useEffect, useRef, useCallback } from 'react';
import { continueFluentDialogue, resetDialogueChat } from '../services/geminiService';
import { MicrophoneIcon, VolumeIcon, BackArrowIcon } from './icons';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

// Type definitions for the Web Speech API
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
    abort: () => void;
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

interface DialogueTurn {
    speaker: 'ai' | 'user';
    french: string;
    spanish?: string; // Only for AI
}

interface FluentDialogueProps {
    onClose: () => void;
}

export const FluentDialogue: React.FC<FluentDialogueProps> = ({ onClose }) => {
    const [conversation, setConversation] = useState<DialogueTurn[]>([]);
    const [isAiTurn, setIsAiTurn] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [statusText, setStatusText] = useState("Iniciando...");
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const conversationEndRef = useRef<HTMLDivElement | null>(null);
    const { play, stop, isPlaying } = useTextToSpeech('fr-FR');
    const isMounted = useRef(true);

    const startRecognition = useCallback(() => {
        if (!SpeechRecognition) {
            setError('API de reconocimiento de voz no compatible.');
            setStatusText("Error de compatibilidad.");
            return;
        }
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = true; // Listen continuously
        recognition.interimResults = false;

        recognition.onstart = () => {
            if (!isMounted.current) return;
            setIsListening(true);
            setStatusText("Escuchando...");
        };

        recognition.onend = () => {
            if (!isMounted.current) return;
            setIsListening(false);
            setStatusText("Pausa. Reiniciando...");
            // Automatically restart recognition if it stops, unless AI is talking or we are unmounting
            if (isMounted.current && !isPlaying && !isAiTurn) {
                setTimeout(() => recognition.start(), 500);
            }
        };

        recognition.onresult = (event) => {
            if (!isMounted.current) return;
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (transcript) {
                processUserSpeech(transcript);
            }
        };

        recognition.onerror = (event) => {
             if (event.error !== 'aborted' && event.error !== 'no-speech') {
                setError(`Error de reconocimiento: ${event.error}`);
                setStatusText("Error de micrófono.");
            }
        };
        
        recognitionRef.current = recognition;
        recognition.start();

    }, [isPlaying, isAiTurn]);

    const stopRecognition = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Prevent restart
            recognitionRef.current.abort();
            recognitionRef.current = null;
            setIsListening(false);
        }
    }, []);

    const processUserSpeech = useCallback(async (userInput: string) => {
        if (isAiTurn || !isMounted.current) return;

        stopRecognition(); // Stop listening while processing
        setIsAiTurn(true);
        setStatusText("IA pensando...");
        
        const userTurn: DialogueTurn = { speaker: 'user', french: userInput };
        setConversation(prev => [...prev, userTurn]);
        
        try {
            const aiResponse = await continueFluentDialogue(userInput);
            if (!isMounted.current) return;

            const aiTurn: DialogueTurn = { speaker: 'ai', french: aiResponse.frenchResponse, spanish: aiResponse.spanishTranslation };
            setConversation(prev => [...prev, aiTurn]);
            
            play({ 
                text: aiResponse.frenchResponse, 
                onEnd: () => {
                    if (isMounted.current) {
                        setIsAiTurn(false);
                        startRecognition();
                    }
                } 
            });

        } catch (err) {
            if (!isMounted.current) return;
            setError('Hubo un error al procesar la respuesta.');
            setConversation(prev => prev.filter(turn => turn !== userTurn));
            setIsAiTurn(false);
            setStatusText("Error. Intenta de nuevo.");
            setTimeout(startRecognition, 1000);
        }
    }, [isAiTurn, play, startRecognition, stopRecognition]);


    useEffect(() => {
        isMounted.current = true;
        resetDialogueChat();

        const startConversation = async () => {
            try {
                const response = await continueFluentDialogue();
                 if (!isMounted.current) return;
                const newTurn: DialogueTurn = { speaker: 'ai', french: response.frenchResponse, spanish: response.spanishTranslation };
                setConversation([newTurn]);
                play({ text: response.frenchResponse, onEnd: () => {
                     if (!isMounted.current) return;
                    setIsAiTurn(false);
                    startRecognition();
                }});
            } catch (err) {
                 if (!isMounted.current) return;
                setError('No se pudo iniciar la conversación. Inténtelo de nuevo.');
                setStatusText("Error al iniciar.");
            }
        };

        startConversation();

        return () => {
            isMounted.current = false;
            stopRecognition();
            stop(); // Stop any TTS
            resetDialogueChat();
        };
    }, []); // Empty dependency array means this runs once on mount

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);


    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black z-50 p-4 sm:p-6 md:p-8 flex flex-col">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Diálogo Fluido</h2>
                <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    aria-label="Volver al traductor"
                >
                    <BackArrowIcon />
                    <span>Volver</span>
                </button>
            </header>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {conversation.map((turn, index) => (
                    <div key={index} className={`flex ${turn.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`relative group max-w-md md:max-w-lg rounded-xl px-4 py-3 ${turn.speaker === 'ai' ? 'bg-gray-700 rounded-bl-none' : 'bg-teal-800 rounded-br-none'}`}>
                            <p className="font-semibold text-white pr-8 text-base">{turn.french}</p>
                            {turn.spanish && <p className="text-sm text-gray-300/80 italic mt-1">{turn.spanish}</p>}
                             <button 
                                onClick={() => play(turn.french)} 
                                disabled={isPlaying}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200"
                                aria-label="Escuchar de nuevo"
                            >
                                <VolumeIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {isAiTurn && conversation.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-xl rounded-bl-none px-4 py-3">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={conversationEndRef} />
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700/50 flex-shrink-0">
                <div className="flex flex-col items-center gap-2">
                     <div
                        className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300
                            ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}
                        `}
                    >
                        <MicrophoneIcon className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 h-5">{statusText}</p>
                </div>
            </div>
             {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        </div>
    );
};
