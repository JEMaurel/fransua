import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = ai.models;

const translationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            original: {
                type: Type.STRING,
                description: "La oración original en español.",
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