
import { useState, useEffect, useCallback, useRef } from 'react';

export const useTextToSpeech = (lang: string) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentText, setCurrentText] = useState<string | null>(null);
    const rateRef = useRef<number>(1);
    const loopRef = useRef<boolean>(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // This is the core function that creates and speaks an utterance.
    // It's designed to be called recursively for looping.
    const speak = useCallback((text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rateRef.current;
        utteranceRef.current = utterance;

        utterance.onstart = () => {
            setIsPlaying(true);
            setIsPaused(false);
            setCurrentText(text);
        };

        utterance.onend = () => {
            // Check the loopRef at the moment speech ends.
            if (loopRef.current) {
                // To loop, we call speak again. This creates a new utterance object,
                // which is more reliable across browsers than reusing the old one.
                speak(text);
            } else {
                setIsPlaying(false);
                setIsPaused(false);
                setCurrentText(null);
                utteranceRef.current = null;
            }
        };

        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            loopRef.current = false; // Stop looping on error
            setIsPlaying(false);
            setIsPaused(false);
            setCurrentText(null);
            utteranceRef.current = null;
        };

        window.speechSynthesis.speak(utterance);
    }, [lang]);

    const stop = useCallback(() => {
        // This is critical: set loop to false BEFORE canceling.
        // The 'cancel' call will trigger the 'onend' event, and we don't want it to loop.
        loopRef.current = false;
        utteranceRef.current = null;
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentText(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    const play = useCallback((optionsOrText?: string | { text: string; loop?: boolean }) => {
        // Handle resuming from a paused state
        if (typeof optionsOrText === 'undefined') {
            if (isPaused) {
                window.speechSynthesis.resume();
                setIsPaused(false);
                setIsPlaying(true);
            }
            return;
        }

        let text: string;
        let loop: boolean = false;

        if (typeof optionsOrText === 'string') {
            text = optionsOrText;
        } else {
            text = optionsOrText.text;
            loop = optionsOrText.loop ?? false;
        }

        // Set the loop status. This will be checked by the onend handler.
        loopRef.current = loop;

        // Stop any current speech before starting new speech.
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
             // The stop() function will handle resetting state and calling cancel().
             stop();
             // Use a timeout to give the SpeechSynthesis API time to process the cancel()
             setTimeout(() => speak(text), 100);
        } else {
            // If nothing is speaking, we can start immediately.
            speak(text);
        }

    }, [isPaused, stop, speak]);

    const pause = useCallback(() => {
        if (isPlaying) {
            window.speechSynthesis.pause();
            setIsPaused(true);
            setIsPlaying(false);
        }
    }, [isPlaying]);

    const setSpeed = useCallback((rate: number) => {
        rateRef.current = rate;
        // If an utterance is currently speaking or paused, update its rate directly.
        if (utteranceRef.current && (window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
            utteranceRef.current.rate = rate;
        }
    }, []);

    return { play, pause, stop, setSpeed, isPlaying, isPaused, currentText };
};
