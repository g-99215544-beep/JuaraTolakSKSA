import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with environment variable
// Note: In a real production app, you might proxy this through a backend to hide the key,
// but for this SPA generation, we use process.env as requested.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getTeacherFeedback = async (name: string, score: number, correctCount: number): Promise<string> => {
  if (!apiKey) {
    return "API Key missing. Cannot generate feedback.";
  }

  try {
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Student Name: ${name}
      Final Score: ${score}
      Correct Answers: ${correctCount}
      
      Task: Provide a short, cheerful, retro-gaming style feedback message (max 40 words) for this student as if you are a supportive 8-bit video game teacher character. 
      Use emojis. If the score is high (over 200), be very excited. If low, be encouraging. Mention "Level Up" or "High Score" concepts.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 100,
        temperature: 0.7,
      }
    });

    return response.text || "Great job! Keep practicing to beat your high score! 🎮";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Awesome effort! The AI teacher is taking a nap, but you did great! ⭐";
  }
};