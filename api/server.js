// File: api/server.js

// 👇 1. Timeout badhaya (Heavy projects ke liye)
export const config = {
    maxDuration: 60, 
};

export default async function handler(req, res) {
    // 2. Method Check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            console.error("Server Error: API Key missing");
            return res.status(500).json({ error: 'Server Environment Check Failed: API Key missing' });
        }

        // 3. Advanced Prompt Engineering
        const finalPrompt = `
        ACT AS: Senior Software Architect.
        TASK: Create a production-ready coding project for: "${prompt}".

        STRICT RULES:
        1. Detect language (Java, Python, Node.js, etc.) automatically.
        2. Return ONLY a valid JSON array: [{"filename": "string", "code": "string"}]
        3. If Node.js: include 'package.json'. If Java: use 'Main.java'.
        4. ⛔ NO COMMENTS: Do not include // or /* */ lines.
        5. ⛔ NO MARKDOWN: Do not wrap in \`\`\`json. Return RAW JSON string only.

        OUTPUT JSON ONLY:
        `;

        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
        
        // 4. Advanced Configuration (Ye hai asli Magic ✨)
        const requestBody = {
            contents: [{ parts: [{ text: finalPrompt }] }],
            // 👇 Safety Filters OFF (Taaki Java/C++ code block na ho)
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            // 👇 Temperature 0.1 (Taaki AI creative na bane, sirf accurate code likhe)
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192
            }
        };

        const googleResponse = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await googleResponse.json();

        // 5. Error Handling (Agar Google ne block kiya)
        if (data.error) {
            throw new Error(`Google API Error: ${data.error.message}`);
        }
        if (!data.candidates || !data.candidates[0].content) {
            throw new Error("AI ne response block kar diya (Safety Filter Triggered).");
        }

        // 6. Server-Side Cleaning (Safayi Abhiyan 🧹)
        let rawText = data.candidates[0].content.parts[0].text;
        
        // Markdown hatana (```json ... ```)
        const cleanJson = rawText.replace(/```json|```/g, '').trim();

        // 7. Validation (Check karo JSON sahi hai ya nahi)
        try {
            const parsedFiles = JSON.parse(cleanJson);
            
            // ✅ SUCCESS: Clean data bhejo
            return res.status(200).json({ 
                success: true, 
                files: parsedFiles 
            });

        } catch (jsonError) {
            console.error("JSON Parse Fail:", rawText);
            return res.status(500).json({ 
                error: "AI generated invalid JSON. Please try again.",
                raw_response: rawText 
            });
        }

    } catch (error) {
        console.error("Server Crash Log:", error.message);
        res.status(500).json({ error: error.message });
    }
}