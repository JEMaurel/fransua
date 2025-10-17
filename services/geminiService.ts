import { GoogleGenAI, Type, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = ai.models;

let chat: Chat | null = null;

const translationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            original: {
                type: Type.STRING,
                description: "La oración original en español que se está traduciendo.",
            },
            translation: {
                type: Type.STRING,
                description: "La traducción de la oración al francés.",
            },
            pronunciation: {
                type: Type.STRING,
                description: "Una guía de pronunciación fonética simple para la traducción al francés.",
            },
        },
        required: ["original", "translation", "pronunciation"],
    },
};

const startTranslationChat = () => {
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `Eres un traductor experto de español a francés. Tu tarea es traducir el texto proporcionado por el usuario.
- Siempre responde en formato JSON que se ajuste al esquema proporcionado.
- Divide el texto en oraciones si es necesario y proporciona una traducción y pronunciación para cada una.
- Si el usuario te pide que cambies algo (por ejemplo, "cambia 'coche' por 'auto'"), entiende que se refiere al texto anterior y proporciona una traducción nueva y completa de la frase modificada.
- Mantén el contexto de la conversación para permitir traducciones iterativas.`,
        },
    });
};

export const translateWithChat = async (text: string) => {
    if (!chat) {
        startTranslationChat();
    }

    const prompt = `Traduce el siguiente texto, o modifica la traducción anterior según mi petición. Devuelve el resultado como un JSON que se ajuste al esquema proporcionado.

Texto: "${text}"`;

    try {
        if (!chat) throw new Error("El chat no está inicializado.");
        
        const response = await chat.sendMessage({
            message: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: translationSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error en la traducción de Gemini (Chat):", error);
        resetChat(); // Reset chat on error to start fresh
        throw new Error("La solicitud de traducción a la API de Gemini falló.");
    }
};

export const resetChat = () => {
    chat = null;
};


// Standalone translation for one-off tasks like story generation
export const translateAndPronounce = async (text: string) => {
    const prompt = `Traduce el siguiente texto de español a francés. Divide el texto en oraciones si es necesario. Para cada oración, proporciona el texto original, la traducción al francés y una guía de pronunciación fonética simple y fácil de leer. Devuelve el resultado como un JSON que se ajuste al esquema proporcionado.

Texto a traducir:
"${text}"`;

    try {
        const response = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: translationSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error en la traducción de Gemini:", error);
        throw new Error("La solicitud de traducción a la API de Gemini falló.");
    }
};

export const generateStory = async (theme?: string) => {
    const prompt = `Genera una historia muy corta en español, de un solo párrafo (alrededor de 3 a 5 frases).
    ${theme ? `El tema de la historia es: "${theme}".` : 'La historia puede ser sobre cualquier tema interesante.'}
    Asegúrate de que la historia sea coherente y esté bien escrita.`;

    try {
        const response = await model.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error en la generación de historia de Gemini:", error);
        throw new Error("La solicitud de generación de historia a la API de Gemini falló.");
    }
};

export const getTextFromImage = async (base64Image: string, mimeType: string) => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "Extrae todo el texto en español de esta imagen. Si no hay texto, responde con una cadena vacía.",
        };

        const response = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error en la extracción de texto de imagen de Gemini:", error);
        throw new Error("La solicitud de extracción de texto de imagen a la API de Gemini falló.");
    }
};


export const translateText = async (text: string, fromLanguage: string, toLanguage: string) => {
    const prompt = `Traduce el siguiente texto de ${fromLanguage} a ${toLanguage}: "${text}"`;
    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error al traducir de ${fromLanguage} a ${toLanguage}:`, error);
        throw new Error("La solicitud de traducción simple a la API de Gemini falló.");
    }
};
