import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * analyzes a blood request description and returns severity classification
 * @param description - The user-provided case description
 * @returns { severity: string, reason: string }
 */
export const analyzeSeverity = async (description: string) => {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a medical triage assistant for "BloodLine", a blood donation platform. 
                    Analyze the user's description of their situation and determine the severity of the blood requirement.
                    
                    Respond ONLY in JSON format:
                    {
                        "severity": "Critical" | "Urgent" | "Normal" | "Low",
                        "reasoning": "A brief 1-sentence medical justification"
                    }
                    
                    Guidelines:
                    - Critical: Immediate life-threatening emergency (accidents, active heavy bleeding, trauma).
                    - Urgent: Surgery scheduled today, severe but stable condition.
                    - Normal: Scheduled transfusion, chronic condition management.
                    - Low: Stock replenishment, general health monitoring.`
                },
                {
                    role: "user",
                    content: description
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;
        return content ? JSON.parse(content) : { severity: "Normal", reasoning: "Automatic fallback" };
    } catch (error) {
        console.error("Groq AI Error:", error);
        return { severity: "Normal", reasoning: "AI Service temporarily unavailable" };
    }
};
