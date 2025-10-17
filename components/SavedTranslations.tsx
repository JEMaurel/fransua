import React from 'react';
import { TranslationUnit } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { PlayIcon, StopIcon, TrashIcon, ChevronIcon } from './icons';

interface SavedTranslationsProps {
    items: TranslationUnit[];
    onRemove: (item: TranslationUnit) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const SavedItem: React.FC<{ item: TranslationUnit; onRemove: (item: TranslationUnit) => void; }> = ({ item, onRemove }) => {
    const { play, stop, isPlaying, currentText } = useTextToSpeech('fr-FR');
    const thisIsPlaying = isPlaying && currentText === item.translation;

    return (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_4fr_3fr_auto] gap-x-6 gap-y-4 py-3 border-b border-gray-700 last:border-b-0 items-center">
            <p className="text-gray-300 text-sm">{item.original}</p>
            <p className="text-blue-300 text-sm">{item.translation}</p>
            <p className="text-gray-500 italic text-xs">{item.pronunciation}</p>
            <div className="flex items-center gap-2 justify-self-end">
                <button
                    onClick={() => thisIsPlaying ? stop() : play(item.translation)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600/50 hover:bg-blue-600 text-white transition-all duration-200"
                    aria-label={thisIsPlaying ? "Detener" : "Reproducir"}
                >
                    {thisIsPlaying ? <StopIcon /> : <PlayIcon />}
                </button>
                <button
                    onClick={() => onRemove(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600/50 hover:bg-red-600 text-white transition-all duration-200"
                    aria-label="Eliminar traducción guardada"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export const SavedTranslations: React.FC<SavedTranslationsProps> = ({ items, onRemove, isExpanded, onToggleExpand }) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <button
                onClick={onToggleExpand}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-700/30 transition-colors"
                aria-expanded={isExpanded}
            >
                <h2 className="text-lg font-semibold text-white">
                    Traducciones Guardadas ({items.length})
                </h2>
                <ChevronIcon className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-6 pt-0">
                    <div className="space-y-2">
                         <div className="grid grid-cols-1 md:grid-cols-[2fr_4fr_3fr_auto] gap-x-6 pb-2 text-sm font-bold text-gray-400 border-b-2 border-gray-600">
                            <h3>Español</h3>
                            <h3>Francés</h3>
                            <h3>Pronunciación</h3>
                            <span className="sr-only">Acciones</span>
                        </div>
                        {items.map((item, index) => (
                            <SavedItem key={index} item={item} onRemove={onRemove} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
