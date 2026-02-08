

// 👇 Ye setting time limit ko 10s se badha kar 60s kar degi
export const config = {
    maxDuration: 60, 
};

export default async function handler(req, res) {
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
       
        const { prompt } = req.body; 

        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Server Error: API Key missing' });
        }

        
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        
        const finalPrompt = `
You are a Senior Full Stack Developer.  <-- (Role: Senior Dev)
Your task is to generate a production-ready Node.js project based on this request: "${prompt}"

RULES:
1. Return ONLY a valid JSON array. <-- (Format: Sirf code, no chat)
2. Always include 'package.json'.    <-- (Standard: Dependencies zaroori hain)
3. Code must be modern (ES6+).       <-- (Quality: Naya code)
`;

       
        const googleResponse = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
        });

        const data = await googleResponse.json();

        // 7. Result wapis user ko bhejein
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}