import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Changed from named import `{ LanguageInput }` to default import `LanguageInput`.
import LanguageInput from './components/LanguageInput';
import type { LanguageInputRef } from './components/LanguageInput';
import { TranslationOutput } from './components/TranslationOutput';
import { SpeechPractice } from './components/SpeechPractice';
import { FluentDialogue } from './components/FluentDialogue';
import { SavedTranslations } from './components/SavedTranslations';
import { TranslationUnit } from './types';
import { translateWithChat, generateStory, getTextFromImage, resetChat, modifyText, resetDialogueChat } from './services/geminiService';
import { LogoIcon, ChatBubbleIcon } from './components/icons';

const App: React.FC = () => {
  const [translationResult, setTranslationResult] = useState<TranslationUnit[]>([]);
  const [savedTranslations, setSavedTranslations] = useState<TranslationUnit[]>([]);
  const [isSavedExpanded, setIsSavedExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isDialogueVisible, setIsDialogueVisible] = useState(false);
  const [isFluentDialogueVisible, setIsFluentDialogueVisible] = useState(false);
  const languageInputRef = useRef<LanguageInputRef>(null);

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

  const handleTranslate = useCallback(async (textToTranslate: string) => {
    if (!textToTranslate.trim()) {
      setTranslationResult([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await translateWithChat(textToTranslate);
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
    resetDialogueChat();
    setTranslationResult([]);
    setText('');
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
      setText(story); // Update the input text with the generated story
      await handleTranslate(story); // Translate the new story
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Un error desconocido ocurrió.';
      setError(`No se pudo generar y traducir la historia. ${errorMessage}`);
      setTranslationResult([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleTranslate]);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            resolve(result.split(',')[1]);
          } else {
            reject('No se pudo leer la imagen.');
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      
      const extractedText = await getTextFromImage(base64Image, file.type);
      setText(extractedText);
      await handleTranslate(extractedText);

    } catch (err) {
      console.error(err);
      setError('No se pudo procesar la imagen. Inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [handleTranslate]);

  const handleModifyText = useCallback(async (baseText: string, instruction: string) => {
    setIsLoading(true);
    setError(null);
    setTranslationResult([]); // Clear old translation as it's now invalid
    try {
      const newText = await modifyText(baseText, instruction);
      setText(newText);
    } catch (err) {
      console.error(err);
      setError('No se pudo modificar el texto. Inténtelo de nuevo.');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-200 font-sans">
      <div className={isDialogueVisible || isFluentDialogueVisible ? 'hidden' : 'p-4 sm:p-6 md:p-8'}>
        <div className="max-w-7xl mx-auto w-full">
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
                  ref={languageInputRef}
                  text={text}
                  onTextChange={setText}
                  onTranslate={handleTranslate}
                  onGenerateAndTranslate={handleGenerateAndTranslate}
                  onImageUpload={handleImageUpload}
                  onResetChat={handleResetChat}
                  onModifyText={handleModifyText}
                  isLoading={isLoading}
                  hasTranslation={translationResult.length > 0}
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

              <div className="border-t border-gray-700/50 pt-8 flex justify-center flex-wrap gap-4">
                <button
                  onClick={() => setIsDialogueVisible(true)}
                  className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-indigo-500/50"
                  aria-expanded={isDialogueVisible}
                >
                  <ChatBubbleIcon className="h-6 w-6" />
                  <span>Práctica de Diálogo</span>
                </button>
                 <button
                  onClick={() => setIsFluentDialogueVisible(true)}
                  className="inline-flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-teal-500/50"
                  aria-expanded={isFluentDialogueVisible}
                >
                  <ChatBubbleIcon className="h-6 w-6" />
                  <span>Diálogo Fluido</span>
                </button>
              </div>
          </main>
        </div>
      </div>
      
      {isDialogueVisible && (
        <SpeechPractice onClose={() => setIsDialogueVisible(false)} />
      )}
      {isFluentDialogueVisible && (
        <FluentDialogue onClose={() => setIsFluentDialogueVisible(false)} />
      )}
    </div>
  );
};

export default App;
