import { GoogleGenAI, Type } from "@google/genai";

export { Type };

const getApiKey = () => import.meta.env.VITE_API_KEY;

/**
 * Sanitizes any string or error object to remove the API key.
 */
const sanitize = (input: any): any => {
    const apiKey = getApiKey();
    if (!apiKey) return input;

    if (typeof input === 'string') {
        return input.replaceAll(apiKey, '***REDACTED***');
    }

    if (input instanceof Error) {
        const sanitizedError = new Error(sanitize(input.message));
        sanitizedError.stack = sanitize(input.stack);
        return sanitizedError;
    }

    if (typeof input === 'object' && input !== null) {
        const sanitizedObj: any = Array.isArray(input) ? [] : {};
        for (const key in input) {
            sanitizedObj[key] = sanitize(input[key]);
        }
        return sanitizedObj;
    }

    return input;
};

export const geminiClient = {
    /**
     * Securely generates content using Gemini.
     * Sanitizes all inputs and outputs to prevent API key leakage.
     */
    generateContent: async (options: {
        model: string;
        contents: any;
        config?: any;
    }) => {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error("Gemini API Key is missing. Please set VITE_API_KEY in your environment.");
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: options.model,
                contents: options.contents,
                config: options.config
            });

            return {
                text: sanitize(response.text),
                // Add other fields if needed, but ensure they are safe
            };
        } catch (error) {
            const sanitizedError = sanitize(error);
            console.error("Gemini API Error (Sanitized):", sanitizedError);
            throw sanitizedError;
        }
    }
};
