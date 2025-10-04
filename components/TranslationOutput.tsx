import React, { useEffect, useState } from 'react';
import { TranslationUnit } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { PlayIcon, PauseIcon, StopIcon, VolumeIcon } from './icons';

interface TranslationOutputProps {
  results: TranslationUnit[];
  isLoading: boolean;
  error: string | null;
}

const TranslationItem: React.FC<{ item: TranslationUnit, onPlay: (text: string) => void, onStop: () => void, isPlaying: boolean, currentText: string | null }> = ({ item, onPlay, onStop, isPlaying, currentText }) => {
    const thisIsPlaying = isPlaying && currentText === item.translation;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4 border-b border-gray-700 last:border-b-0 items-start">
            {/* Spanish Column */}
            <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 text-center text-sm font-semibold text-gray-400 pt-1">ES</span>
                <p className="text-gray-300">{item.original}</p>
            </div>

            {/* French Column */}
            <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 text-center text-sm font-semibold text-blue-400 pt-1">FR</span>
                <div className="flex-grow">
                     <p className="text-blue-300">{item.translation}</p>
                     <p className="text-sm text-gray-500 italic mt-1">{item.pronunciation}</p>
                </div>
                <button
                    onClick={() => thisIsPlaying ? onStop() : onPlay(item.translation)}
                    className="p-1.5 rounded-full bg-gray-600/50 hover:bg-blue-600 text-white transition-all duration-200 flex-shrink-0"
                    aria-label={thisIsPlaying ? "Detener" : "Reproducir"}
                >
                    {thisIsPlaying ? <StopIcon /> : <PlayIcon />}
                </button>
            </div>
        </div>
    );
};


export const TranslationOutput: React.FC<TranslationOutputProps> = ({ results, isLoading, error }) => {
    const { play, pause, stop, setSpeed, isPlaying, isPaused, currentText } = useTextToSpeech('fr-FR');
    const [speed, setSpeedValue] = useState(1);

    useEffect(() => {
        setSpeed(speed);
    }, [speed, setSpeed]);

    const handlePlayAll = () => {
        const fullText = results.map(r => r.translation).join(' ');
        if (isPlaying && !isPaused) {
            pause();
        } else if (isPlaying && isPaused) {
            play(); // resume
        } else {
            play(fullText);
        }
    };
    
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700/50 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
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
                            onClick={handlePlayAll}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <VolumeIcon />
                            {isPlaying && !isPaused ? 'Pausar' : 'Escuchar Todo'}
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
                        {results.map((item, index) => (
                           <TranslationItem 
                                key={index} 
                                item={item}
                                onPlay={play}
                                onStop={stop}
                                isPlaying={isPlaying}
                                currentText={currentText}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};