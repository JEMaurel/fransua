import React, { useState, useEffect, useRef, useCallback } from 'react';
import { continueDialogue, translateText, resetDialogueChat } from '../services/geminiService';
import { MicrophoneIcon, VolumeIcon, SendIcon, ChatBubbleIcon, BackArrowIcon } from './icons';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

// FIX: Removed duplicate SpeechRecognition type declarations. These are now defined in FluentDialogue.tsx to avoid conflicts.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface DialogueTurn {
    speaker: 'ai' | 'user';
    french: string;
    spanish: string;
}

interface SuggestedResponse {
    french: string;
    spanish: string;
    pronunciation: string;
}

interface SpeechPracticeProps {
    onClose: () => void;
}

export const SpeechPractice: React.FC<SpeechPracticeProps> = ({ onClose }) => {
    const [conversation, setConversation] = useState<DialogueTurn[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isAiTurn, setIsAiTurn] = useState(false);
    const [suggestedResponseDetails, setSuggestedResponseDetails] = useState<SuggestedResponse | null>(null);
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
        setSuggestedResponseDetails(null);
        setError(null);
        setIsAiTurn(true);
        setIsSuggestionHighlighted(false);
        try {
            const response = await continueDialogue();
            const newTurn: DialogueTurn = { speaker: 'ai', french: response.frenchResponse, spanish: response.spanishTranslation };
            setConversation([newTurn]);
            setSuggestedResponseDetails(response.suggestedUserResponseDetails);
            play({ text: response.frenchResponse, onEnd: () => setIsAiTurn(false) });
        } catch (err) {
            setError('No se pudo iniciar la conversación. Inténtelo de nuevo.');
            setIsAiTurn(false);
        }
    }, [play]);

    const processUserSpeech = useCallback(async (userInput: string | { french: string; spanish: string; }) => {
        setIsAiTurn(true);
        setIsSuggestionHighlighted(false);
        setSuggestedResponseDetails(null);

        const isSuggestion = typeof userInput !== 'string';
        const userFrench = isSuggestion ? userInput.french : userInput;
        const userSpanish = isSuggestion ? userInput.spanish : 'Traduciendo...';
        
        const userTurn: DialogueTurn = { speaker: 'user', french: userFrench, spanish: userSpanish };
        setConversation(prev => [...prev, userTurn]);
        
        try {
            // Only call for translation if it's a raw transcript
            const finalSpanish = isSuggestion 
                ? userSpanish 
                : await translateText(userFrench, 'Francés', 'Español');

            // Update user turn with translation if it wasn't a suggestion
            if (!isSuggestion) {
                 setConversation(prev => prev.map(turn => turn === userTurn ? { ...turn, spanish: finalSpanish } : turn));
            }

            const aiResponse = await continueDialogue(userFrench);
            
            // Add AI response
            const aiTurn: DialogueTurn = { speaker: 'ai', french: aiResponse.frenchResponse, spanish: aiResponse.spanishTranslation };
            setConversation(prev => [...prev, aiTurn]);
            setSuggestedResponseDetails(aiResponse.suggestedUserResponseDetails);

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
        if (suggestedResponseDetails) {
            processUserSpeech({
                french: suggestedResponseDetails.french,
                spanish: suggestedResponseDetails.spanish,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black z-50 p-4 sm:p-6 md:p-8 flex flex-col">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Práctica de Diálogo</h2>
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
                {conversation.length === 0 && !isAiTurn && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                         <ChatBubbleIcon className="h-24 w-24" />
                        <p className="mt-4 text-lg">Entabla una conversación con la IA para mejorar tu fluidez.</p>
                        <button onClick={startConversation} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg">
                            Iniciar Diálogo
                        </button>
                    </div>
                )}
                {conversation.map((turn, index) => (
                    <div key={index} className={`flex ${turn.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`relative group max-w-md md:max-w-lg rounded-xl px-4 py-3 ${turn.speaker === 'ai' ? 'bg-gray-700 rounded-bl-none' : 'bg-blue-800 rounded-br-none'}`}>
                            <p className="font-semibold text-white pr-8 text-base">{turn.french}</p>
                            <p className="text-sm text-gray-300/80 italic mt-1">{turn.spanish}</p>
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

            {conversation.length > 0 && (
                <div className="pt-4 mt-4 border-t border-gray-700/50 space-y-4 flex-shrink-0">
                    {suggestedResponseDetails && !isAiTurn && (
                        <div className={`bg-gray-900/50 p-4 rounded-lg border transition-all ${isSuggestionHighlighted ? 'border-yellow-400 shadow-lg shadow-yellow-400/10' : 'border-gray-600'}`}>
                            <p className="text-sm text-gray-400 mb-3 text-center">Sugerencia de la IA:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start text-center">
                                <div className="p-3 bg-gray-800/70 rounded-lg">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Francés</p>
                                    <p className="font-semibold text-blue-300 text-xl lg:text-2xl mt-1">"{suggestedResponseDetails.french}"</p>
                                </div>
                                <div className="p-3 bg-gray-800/70 rounded-lg">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Español</p>
                                    <p className="text-gray-200 text-xl lg:text-2xl mt-1">"{suggestedResponseDetails.spanish}"</p>
                                </div>
                                <div className="p-3 bg-gray-800/70 rounded-lg">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Fonética</p>
                                    <p className="text-gray-400 italic text-xl lg:text-2xl mt-1">({suggestedResponseDetails.pronunciation})</p>
                                </div>
                            </div>
                            <div className="flex justify-center items-center gap-4 mt-4">
                                <button onClick={() => play(suggestedResponseDetails.french)} disabled={isPlaying} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors" aria-label="Escuchar sugerencia"><VolumeIcon className="w-6 h-6" /></button>
                                <button onClick={handleUseSuggestion} className="flex items-center gap-2 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"><SendIcon className="w-5 h-5" /> Usar</button>
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