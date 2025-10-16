import React, { useState, useCallback } from 'react';
import { LanguageInput } from './components/LanguageInput';
import { TranslationOutput } from './components/TranslationOutput';
import { SpeechPractice } from './components/SpeechPractice';
import { TranslationUnit } from './types';
import { translateAndPronounce, generateStory, getTextFromImage } from './services/geminiService';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [translationResult, setTranslationResult] = useState<TranslationUnit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = useCallback(async (text: string) => {
    if (!text.trim()) {
      setTranslationResult([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await translateAndPronounce(text);
      // Gemini can sometimes return an object instead of an array for single sentences
      if (Array.isArray(result)) {
        setTranslationResult(result);
      } else if (result && typeof result === 'object') {
        // Coerce single object into an array
        const singleResult = result as unknown as TranslationUnit;
        if(singleResult.original && singleResult.translation && singleResult.pronunciation) {
          setTranslationResult([singleResult]);
        } else {
           throw new Error('La API devolvió un formato inesperado.');
        }
      } else {
        throw new Error('La respuesta de la API no es un formato de traducción válido.');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo completar la traducción. Inténtelo de nuevo.');
      setTranslationResult([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleGenerateStory = useCallback(async (theme?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const story = await generateStory(theme);
      return story;
    } catch (err) {
      console.error(err);
      setError('No se pudo generar la historia. Inténtelo de nuevo.');
      return '';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      return new Promise<string>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const base64Image = (e.target?.result as string).split(',')[1];
            if (!base64Image) {
              reject('No se pudo leer la imagen.');
              return;
            }
            const text = await getTextFromImage(base64Image, file.type);
            resolve(text);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo procesar la imagen. Inténtelo de nuevo.');
      return '';
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-200 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <LogoIcon />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Traductor AI Francés</h1>
          </div>
          <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
            Powered by Gemini
          </a>
        </header>

        <main className="space-y-12">
          <div className={`grid grid-cols-1 ${translationResult.length > 0 ? 'lg:grid-cols-[1fr_4fr]' : 'lg:grid-cols-2'} gap-8 transition-all duration-500`}>
            <LanguageInput 
              onTranslate={handleTranslate}
              onGenerateStory={handleGenerateStory}
              onImageUpload={handleImageUpload}
              isLoading={isLoading}
            />
            <TranslationOutput
              results={translationResult}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <SpeechPractice />
        </main>
      </div>
    </div>
  );
};

export default App;