// File: api/server.js

export const config = {
    runtime: 'edge', // Code ko fast banata hai
};

export default async function handler(req) {
    // 1. Sirf POST request accept karein
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        // 2. User ke computer se PROMPT receive karein
        const { prompt } = await req.json();

        // 3. Vercel ke safe locker se API Key nikalein
        // (Ye key code me nahi likhi hai, ye Vercel settings se aayegi)
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return new Response(JSON.stringify({ error: 'Server Error: API Key missing' }), { status: 500 });
        }

        // 4. Google Gemini API URL
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        // 5. Naya Prompt Structure banayein
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
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}