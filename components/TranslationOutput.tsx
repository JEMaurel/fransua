import React, { useEffect, useState } from 'react';
import { TranslationUnit } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { PlayIcon, StopIcon, VolumeIcon, RepeatIcon, StarIcon } from './icons';

interface TranslationOutputProps {
  results: TranslationUnit[];
  isLoading: boolean;
  error: string | null;
  onToggleSave: (item: TranslationUnit) => void;
  savedTranslations: TranslationUnit[];
}

interface TranslationItemProps {
    item: TranslationUnit;
    onPlay: (text: string) => void;
    onStop: () => void;
    onToggleLoop: () => void;
    onToggleSave: (item: TranslationUnit) => void;
    isSaved: boolean;
    isPlaying: boolean;
    isLooping: boolean;
    currentText: string | null;
}

const TranslationItem: React.FC<TranslationItemProps> = ({ item, onPlay, onStop, onToggleLoop, onToggleSave, isSaved, isPlaying, isLooping, currentText }) => {
    const thisIsPlaying = isPlaying && currentText === item.translation;

    return (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_4fr_3fr] gap-x-6 gap-y-4 py-4 border-b border-gray-700 last:border-b-0 items-start">
            {/* Spanish Column */}
            <div>
                <p className="text-gray-300">{item.original}</p>
            </div>

            {/* French Column */}
            <div className="flex items-start justify-between gap-3">
                <p className="text-blue-300 flex-grow">{item.translation}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                   <button
                        onClick={() => onToggleSave(item)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${isSaved ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}
                        aria-label={isSaved ? "Quitar de favoritos" : "Guardar en favoritos"}
                    >
                       <StarIcon filled={isSaved} />
                    </button>
                    <button
                        onClick={onToggleLoop}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 font-mono font-bold text-sm ${isLooping ? 'bg-blue-600 text-white' : 'bg-gray-600/50 hover:bg-blue-800 text-gray-300'}`}
                        aria-label={isLooping ? "Desactivar ciclo" : "Activar ciclo"}
                    >
                        C
                    </button>
                    <button
                        onClick={() => thisIsPlaying ? onStop() : onPlay(item.translation)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-600/50 hover:bg-blue-600 text-white transition-all duration-200"
                        aria-label={thisIsPlaying ? "Detener" : "Reproducir"}
                    >
                        {thisIsPlaying ? <StopIcon /> : <PlayIcon />}
                    </button>
                </div>
            </div>

            {/* Phonetics Column */}
            <div>
                 <p className="text-sm text-gray-500 italic">{item.pronunciation}</p>
            </div>
        </div>
    );
};


export const TranslationOutput: React.FC<TranslationOutputProps> = ({ results, isLoading, error, onToggleSave, savedTranslations }) => {
    const { play, pause, stop, setSpeed, isPlaying, isPaused, currentText } = useTextToSpeech('fr-FR');
    const [speed, setSpeedValue] = useState(1);
    const [isGlobalLooping, setIsGlobalLooping] = useState(false);
    const [loopingItemIndex, setLoopingItemIndex] = useState<number | null>(null);
    const savedOriginals = new Set(savedTranslations.map(t => t.original));

    useEffect(() => {
        setSpeed(speed);
    }, [speed, setSpeed]);

    const handlePlayAll = () => {
        const fullText = results.map(r => r.translation).join(' ');
        if (isPlaying && !isPaused && currentText === fullText) {
            pause();
        } else if (isPlaying && isPaused && currentText === fullText) {
            play(); // resume
        } else {
            stop(); // Stop any other playback
            setLoopingItemIndex(null); // Clear individual loop
            play({ text: fullText, loop: isGlobalLooping });
        }
    };
    
    const handleToggleGlobalLoop = () => {
        const nextState = !isGlobalLooping;
        setIsGlobalLooping(nextState);
        if (nextState) {
            setLoopingItemIndex(null);
        }
        if (isPlaying) {
            stop();
        }
    };

    const handlePlaySingle = (text: string, index: number) => {
        stop();
        setIsGlobalLooping(false);
        play({ text, loop: loopingItemIndex === index });
    };

    const handleToggleLoopSingle = (index: number) => {
        if (isPlaying) stop();
        
        if (loopingItemIndex === index) {
            setLoopingItemIndex(null); // Toggle off
        } else {
            setLoopingItemIndex(index); // Toggle on for this item
            setIsGlobalLooping(false); // Ensure global loop is off
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-lg font-semibold text-white">Traducción al Francés</h2>
                {results.length > 0 && (
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="speed" className="text-sm text-gray-400">Velocidad:</label>
                            <input
                                type="range"
                                id="speed"
                                min="0.5"
                                max="1.5"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeedValue(parseFloat(e.target.value))}
                                className="w-24"
                            />
                        </div>
                        <button 
                            onClick={handleToggleGlobalLoop}
                            className={`flex items-center gap-2 text-white font-semibold py-2 px-3 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isGlobalLooping ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                        >
                           <RepeatIcon />
                           Ciclo
                        </button>
                        <button 
                            onClick={handlePlayAll}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <VolumeIcon />
                            {isPlaying && !isPaused && currentText === results.map(r => r.translation).join(' ') ? 'Pausar' : 'Escuchar Todo'}
                        </button>
                         {isPlaying && <button onClick={stop} className="p-2 rounded-full bg-red-600 hover:bg-red-700"><StopIcon /></button>}
                    </div>
                )}
            </div>
            <div className="flex-grow bg-gray-900/70 border border-gray-600 rounded-lg p-2 overflow-y-auto min-h-[350px]">
                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    </div>
                )}
                {error && <div className="text-red-400 p-4">{error}</div>}
                {!isLoading && !error && results.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        La traducción aparecerá aquí.
                    </div>
                )}
                {!isLoading && !error && results.length > 0 && (
                    <div className="px-4">
                        <div className="grid grid-cols-1 md:grid-cols-[2fr_4fr_3fr] gap-x-6 pb-2 text-sm font-bold text-gray-400 border-b-2 border-gray-600">
                            <h3>Español</h3>
                            <h3>Francés</h3>
                            <h3>Pronunciación</h3>
                        </div>
                        {results.map((item, index) => (
                           <TranslationItem 
                                key={index} 
                                item={item}
                                onPlay={(text) => handlePlaySingle(text, index)}
                                onStop={stop}
                                onToggleLoop={() => handleToggleLoopSingle(index)}
                                onToggleSave={onToggleSave}
                                isSaved={savedOriginals.has(item.original)}
                                isPlaying={isPlaying}
                                isLooping={loopingItemIndex === index}
                                currentText={currentText}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
