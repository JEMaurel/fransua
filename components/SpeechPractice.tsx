import React, { useState, useEffect, useRef, useCallback } from 'react';
import { continueDialogue, translateText, resetDialogueChat } from '../services/geminiService';
import { MicrophoneIcon, VolumeIcon, SendIcon, ExpandIcon, CollapseIcon, ChatBubbleIcon } from './icons';
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
    spanish: string;
}

interface SpeechPracticeProps {
    isFocusMode: boolean;
    onToggleFocus: () => void;
}

export const SpeechPractice: React.FC<SpeechPracticeProps> = ({ isFocusMode, onToggleFocus }) => {
    const [conversation, setConversation] = useState<DialogueTurn[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isAiTurn, setIsAiTurn] = useState(false);
    const [currentSuggestedResponse, setCurrentSuggestedResponse] = useState<string | null>(null);
    const [isSuggestionHighlighted, setIsSuggestionHighlighted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const conversationEndRef = useRef<HTMLDivElement | null>(null);
    const { play, stop, isPlaying } = useTextToSpeech('fr-FR');

    useEffect(() => {
        return () => {
            resetDialogueChat();
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            stop();
        };
    }, [stop]);

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    const startConversation = useCallback(async () => {
        setConversation([]);
        setCurrentSuggestedResponse(null);
        setError(null);
        setIsAiTurn(true);
        setIsSuggestionHighlighted(false);
        try {
            const response = await continueDialogue();
            const newTurn: DialogueTurn = { speaker: 'ai', french: response.frenchResponse, spanish: response.spanishTranslation };
            setConversation([newTurn]);
            setCurrentSuggestedResponse(response.suggestedUserResponse);
            play({ text: response.frenchResponse, onEnd: () => setIsAiTurn(false) });
        } catch (err) {
            setError('No se pudo iniciar la conversación. Inténtelo de nuevo.');
            setIsAiTurn(false);
        }
    }, [play]);

    const processUserSpeech = useCallback(async (transcript: string) => {
        setIsAiTurn(true);
        setIsSuggestionHighlighted(false);
        setCurrentSuggestedResponse(null);

        // Add user turn optimistically
        const userTurn: DialogueTurn = { speaker: 'user', french: transcript, spanish: 'Traduciendo...' };
        setConversation(prev => [...prev, userTurn]);
        
        try {
            const [spanishTranslation, aiResponse] = await Promise.all([
                translateText(transcript, 'Francés', 'Español'),
                continueDialogue(transcript)
            ]);

            // Update user turn with translation
            setConversation(prev => prev.map(turn => turn === userTurn ? { ...turn, spanish: spanishTranslation } : turn));
            
            // Add AI response
            const aiTurn: DialogueTurn = { speaker: 'ai', french: aiResponse.frenchResponse, spanish: aiResponse.spanishTranslation };
            setConversation(prev => [...prev, aiTurn]);
            setCurrentSuggestedResponse(aiResponse.suggestedUserResponse);

            play({ text: aiResponse.frenchResponse, onEnd: () => setIsAiTurn(false) });

        } catch (err) {
            setError('Hubo un error al procesar la respuesta. La IA podría no haber entendido.');
            setConversation(prev => prev.filter(turn => turn !== userTurn)); // Remove optimistic turn
            setIsAiTurn(false);
            setIsSuggestionHighlighted(true); // Highlight the last good suggestion
        }

    }, [play]);

    const handleToggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            return;
        }
        if (!SpeechRecognition) {
            setError('API de reconocimiento de voz no compatible.');
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => {
            setIsRecording(false);
            recognitionRef.current = null;
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                processUserSpeech(transcript);
            }
        };
        recognition.onerror = (event) => {
            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                setError(`Error de reconocimiento: ${event.error}`);
            }
        };
        
        recognitionRef.current = recognition;
        recognition.start();
    };
    
    const handleUseSuggestion = () => {
        if (currentSuggestedResponse) {
            processUserSpeech(currentSuggestedResponse);
        }
    };

    return (
        <div className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 mt-8 flex flex-col ${isFocusMode ? 'flex-grow h-full' : 'min-h-[400px]'} p-6`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Práctica de Diálogo</h2>
                <button 
                    onClick={onToggleFocus}
                    className="p-2 rounded-full text-gray-400 bg-gray-700/60 hover:bg-gray-700 transition-colors"
                    aria-label={isFocusMode ? 'Salir del modo enfoque' : 'Entrar al modo enfoque'}
                >
                    {isFocusMode ? <CollapseIcon /> : <ExpandIcon />}
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {conversation.length === 0 && !isAiTurn && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                         <ChatBubbleIcon />
                        <p className="mt-2">Entabla una conversación con la IA para mejorar tu fluidez.</p>
                        <button onClick={startConversation} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Iniciar Diálogo
                        </button>
                    </div>
                )}
                {conversation.map((turn, index) => (
                    <div key={index} className={`flex ${turn.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`relative group max-w-md md:max-w-lg rounded-xl px-4 py-2 ${turn.speaker === 'ai' ? 'bg-gray-700 rounded-bl-none' : 'bg-blue-800 rounded-br-none'}`}>
                            <p className="font-semibold text-white pr-8">{turn.french}</p>
                            <p className="text-xs text-gray-300/80 italic mt-1">{turn.spanish}</p>
                             <button 
                                onClick={() => play(turn.french)} 
                                disabled={isPlaying}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-20 disabled:hover:bg-black/20"
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

            {conversation.length > 0 && (
                <div className="pt-4 mt-4 border-t border-gray-700/50 space-y-4">
                    {currentSuggestedResponse && !isAiTurn && (
                        <div className={`bg-gray-900/70 p-3 rounded-lg border transition-all ${isSuggestionHighlighted ? 'border-yellow-400 shadow-lg shadow-yellow-400/10' : 'border-gray-600'}`}>
                            <p className="text-xs text-gray-400 mb-2">Sugerencia de la IA:</p>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                <p className="italic text-gray-200 text-center sm:text-left">"{currentSuggestedResponse}"</p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => play(currentSuggestedResponse)} disabled={isPlaying} className="p-2 rounded-full hover:bg-gray-600 transition-colors"><VolumeIcon /></button>
                                    <button onClick={handleUseSuggestion} className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md transition-colors"><SendIcon className="w-4 h-4" /> Usar</button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={handleToggleRecording}
                            disabled={isAiTurn || isPlaying}
                            className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed
                                ${isRecording ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}
                                ${!isAiTurn && !isRecording && !isPlaying ? 'animate-pulse ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-400' : ''}
                            `}
                            aria-label={isRecording ? 'Detener grabación' : 'Grabar voz'}
                        >
                            <MicrophoneIcon className="h-8 w-8 text-white" />
                        </button>
                        <p className="text-xs text-gray-500 h-4">{isRecording ? "Grabando..." : (isAiTurn ? "Turno de la IA..." : "Presiona para hablar")}</p>
                    </div>
                </div>
            )}
             {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        </div>
    );
};