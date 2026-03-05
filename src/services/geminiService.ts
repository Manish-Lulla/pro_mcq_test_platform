import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getSolutionStream = async (question: string, options: Record<string, string>, context?: string, onChunk?: (chunk: string) => void) => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are an expert tutor. Provide a detailed, step-by-step solution for the following multiple-choice question.
    ${context ? `Context: ${context}` : ""}
    Question: ${question}
    Options: ${JSON.stringify(options)}
    
    Instructions:
    1. Identify the correct answer.
    2. Explain the logic or calculation clearly.
    3. Use LaTeX for ALL mathematical formulas and equations. Wrap inline math in $...$ and block math in $$.
    4. Keep it concise but thorough.
    5. Format the output using Markdown.
  `;

  try {
    const response = await ai.models.generateContentStream({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk?.(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error getting solution:", error);
    throw error;
  }
};

export const chatWithAIStream = async (history: { role: "user" | "model"; parts: { text: string }[] }[], message: string, onChunk?: (chunk: string) => void) => {
  const model = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContentStream({
      model,
      contents: [...history, { role: "user", parts: [{ text: message }] }],
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk?.(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error in AI chat:", error);
    throw error;
  }
};
