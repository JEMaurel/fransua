import React, { useState, useCallback, useEffect } from 'react';
import { LanguageInput } from './components/LanguageInput';
import { TranslationOutput } from './components/TranslationOutput';
import { SpeechPractice } from './components/SpeechPractice';
import { SavedTranslations } from './components/SavedTranslations';
import { TranslationUnit } from './types';
import { translateAndPronounce, generateStory, getTextFromImage, translateWithChat, resetChat } from './services/geminiService';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [translationResult, setTranslationResult] = useState<TranslationUnit[]>([]);
  const [savedTranslations, setSavedTranslations] = useState<TranslationUnit[]>([]);
  const [isSavedExpanded, setIsSavedExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedTranslations = localStorage.getItem('savedTranslations');
      if (storedTranslations) {
        setSavedTranslations(JSON.parse(storedTranslations));
      }
    } catch (e) {
      console.error("No se pudieron cargar las traducciones guardadas:", e);
    }
  }, []);

  const handleTranslate = useCallback(async (text: string) => {
    if (!text.trim()) {
      setTranslationResult([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await translateWithChat(text);
      if (Array.isArray(result)) {
        setTranslationResult(result);
      } else if (result && typeof result === 'object') {
        const singleResult = result as unknown as TranslationUnit;
        if (singleResult.original && singleResult.translation && singleResult.pronunciation) {
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
  
  const handleResetChat = useCallback(() => {
    resetChat();
    setError(null);
  }, []);

  const handleGenerateAndTranslate = useCallback(async (theme?: string) => {
    setIsLoading(true);
    setError(null);
    setTranslationResult([]);
    resetChat(); // Start a new chat for the story
    try {
      const story = await generateStory(theme);
      if (!story) {
        throw new Error('La generación de la historia no devolvió ningún texto.');
      }
      const result = await translateWithChat(story);
      if (Array.isArray(result)) {
        setTranslationResult(result);
      } else if (result && typeof result === 'object') {
        const singleResult = result as unknown as TranslationUnit;
        if (singleResult.original && singleResult.translation && singleResult.pronunciation) {
          setTranslationResult([singleResult]);
        } else {
          throw new Error('La API devolvió un formato de traducción inesperado.');
        }
      } else {
        throw new Error('La respuesta de la API no es un formato de traducción válido.');
      }
      return story;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Un error desconocido ocurrió.';
      setError(`No se pudo generar y traducir la historia. ${errorMessage}`);
      setTranslationResult([]);
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

  const handleToggleSave = useCallback((itemToToggle: TranslationUnit) => {
    setSavedTranslations(prev => {
      const isSaved = prev.some(item => item.original === itemToToggle.original);
      let newSaved;
      if (isSaved) {
        newSaved = prev.filter(item => item.original !== itemToToggle.original);
      } else {
        newSaved = [...prev, itemToToggle];
      }
      localStorage.setItem('savedTranslations', JSON.stringify(newSaved));
      return newSaved;
    });
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
          <div className={`grid grid-cols-1 ${translationResult.length > 0 || savedTranslations.length > 0 ? 'lg:grid-cols-[2fr_3fr]' : 'lg:grid-cols-2'} gap-8 transition-all duration-500`}>
            <LanguageInput
              onTranslate={handleTranslate}
              onGenerateAndTranslate={handleGenerateAndTranslate}
              onImageUpload={handleImageUpload}
              onResetChat={handleResetChat}
              isLoading={isLoading}
            />
            <TranslationOutput
              results={translationResult}
              isLoading={isLoading}
              error={error}
              onToggleSave={handleToggleSave}
              savedTranslations={savedTranslations}
            />
          </div>
          {savedTranslations.length > 0 && (
            <SavedTranslations
              items={savedTranslations}
              onRemove={handleToggleSave}
              isExpanded={isSavedExpanded}
              onToggleExpand={() => setIsSavedExpanded(!isSavedExpanded)}
            />
          )}
          <SpeechPractice />
        </main>
      </div>
    </div>
  );
};

export default App;