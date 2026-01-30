// File: api/server.js

// 👇 Ye setting time limit ko 10s se badha kar 60s kar degi
export const config = {
    maxDuration: 60, 
};

export default async function handler(req, res) {
    // 1. Sirf POST request accept karein
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. User ke computer se PROMPT receive karein
        const { prompt } = req.body; // Note: Node.js me req.body hota hai

        // 3. Vercel ke safe locker se API Key nikalein
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Server Error: API Key missing' });
        }

        // 4. Google Gemini API URL
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        // 5. Naya Prompt Structure
        const finalPrompt = `
        You are an expert developer. Generate a JSON array of files.
        Response format: [{"filename": "string", "code": "string"}]
        User Prompt: "${prompt}"
        `;

        // 6. Google ko request bhejein
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