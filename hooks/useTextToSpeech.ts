import { useState, useEffect, useCallback, useRef } from 'react';

export const useTextToSpeech = (lang: string) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentText, setCurrentText] = useState<string | null>(null);
    const rateRef = useRef<number>(1);
    const loopRef = useRef<boolean>(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const onEndCallbackRef = useRef<(() => void) | null>(null); // Ref to hold the onEnd callback

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
                // To loop, we call speak again.
                speak(text);
            } else {
                setIsPlaying(false);
                setIsPaused(false);
                setCurrentText(null);
                utteranceRef.current = null;
                // If a one-time callback exists, execute it and then clear it.
                if (onEndCallbackRef.current) {
                    onEndCallbackRef.current();
                    onEndCallbackRef.current = null;
                }
            }
        };

        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            loopRef.current = false; // Stop looping on error
            onEndCallbackRef.current = null; // Clear callback on error
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
        onEndCallbackRef.current = null; // Also clear any pending callback on stop
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

    const play = useCallback((optionsOrText?: string | { text: string; loop?: boolean; onEnd?: () => void; }) => {
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
        let onEnd: (() => void) | null = null;

        if (typeof optionsOrText === 'string') {
            text = optionsOrText;
        } else {
            text = optionsOrText.text;
            loop = optionsOrText.loop ?? false;
            onEnd = optionsOrText.onEnd ?? null; // Extract onEnd callback
        }

        // Set the loop status and the onEnd callback. These will be used by the handlers.
        loopRef.current = loop;
        onEndCallbackRef.current = onEnd;

        // Stop any current speech before starting new speech.
        if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
             // The stop() function will handle resetting state and calling cancel().
             // It also clears the previous onEnd callback, which is correct.
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
        if (utteranceRef.current && (window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
            utteranceRef.current.rate = rate;
        }
    }, []);

    return { play, pause, stop, setSpeed, isPlaying, isPaused, currentText };
};