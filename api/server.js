export const config = {
    maxDuration: 60, // 1 Minute Timeout
};

export default async function handler(req, res) {
    // 1. Method Check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            throw new Error('Server Error: API Key missing');
        }

        // 2. Advanced System Prompt (Strict Rules)
        // api/server.js

const finalPrompt = `
ACT AS: Senior Node.js Architect.
TASK: Generate a production-ready project structure for: "${prompt}".

STRICT RESPONSE RULES:
1. Return ONLY a valid JSON array.
2. JSON Format: [{"filename": "string", "code": "string"}]
3. 'package.json' MUST be included with all dependencies.
4. Use ES6 Modules (import/export).
5. ⛔ NO COMMENTS ALLOWED: Do not include ANY comments (// or /* */) in the code. Return only pure executable code.

OUTPUT JSON ONLY:
`;

        // 3. Call Google API with "generationConfig" (Temperature Control)
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }],
                generationConfig: {
                    temperature: 0.1, // ❄️ Low temp = More accurate code, less hallucination
                    maxOutputTokens: 5000 // Allow long code response
                }
            })
        });

        const data = await response.json();

        // 4. Server-Side Cleaning (Safayi Abhiyan) 🧹
        if (!data.candidates || !data.candidates[0].content) {
            throw new Error("AI ne khali jawab diya.");
        }

        let rawText = data.candidates[0].content.parts[0].text;

        // Remove Markdown (```json ... ```)
        const cleanJson = rawText.replace(/```json|```/g, '').trim();

        // 5. Validation (Check karo ki JSON valid hai ya nahi)
        try {
            const parsedFiles = JSON.parse(cleanJson);
            
            // Agar sab sahi hai, to DIRECT Files array bhejo (Google ka kachra format nahi)
            return res.status(200).json({ success: true, files: parsedFiles });

        } catch (jsonError) {
            console.error("JSON Parse Error:", rawText); // Log for debugging
            return res.status(500).json({ error: "AI generated invalid JSON code. Please try again." });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}