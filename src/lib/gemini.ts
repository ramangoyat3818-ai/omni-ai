import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

export async function chatWithGemini(message: string, history: any[] = []) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are Omni One, a universal AI assistant. You are helpful, concise, and have a modern, tech-forward personality. You can help with coding, creative writing, analysis, and more.",
    },
  });

  // Reconstruct history if needed, but for simplicity we'll just send the message for now
  // or use the chat object's sendMessage
  const response: GenerateContentResponse = await chat.sendMessage({ message });
  return response.text;
}

export async function generateImage(prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
