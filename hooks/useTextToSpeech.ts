import { useState, useEffect, useCallback, useRef } from 'react';

export const useTextToSpeech = (lang: string) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentText, setCurrentText] = useState<string | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const rateRef = useRef<number>(1); // Ref to store the current speed rate

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentText(null);
    }, []);

    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    const play = useCallback((text?: string) => {
        if (window.speechSynthesis.paused && isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsPlaying(true);
            return;
        }

        if (text) {
             // Stop any currently playing audio before starting a new one
            if(window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = rateRef.current; // Apply the stored rate
            
            utterance.onstart = () => {
                setIsPlaying(true);
                setIsPaused(false);
                setCurrentText(text);
            };
            
            utterance.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
                setCurrentText(null);
                utteranceRef.current = null;
            };
            
            utterance.onerror = () => {
                setIsPlaying(false);
                setIsPaused(false);
                setCurrentText(null);
                utteranceRef.current = null;
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    }, [lang, isPaused]);

    const pause = useCallback(() => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            setIsPaused(true);
            setIsPlaying(false);
        }
    }, []);

    const setSpeed = useCallback((rate: number) => {
        rateRef.current = rate;
        if (utteranceRef.current) {
            // Update rate of the current utterance if it's playing
            utteranceRef.current.rate = rate;
        }
    }, []);

    return { play, pause, stop, setSpeed, isPlaying, isPaused, currentText };
};