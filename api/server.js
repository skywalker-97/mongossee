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


        const cleanUserPrompt = prompt
            .replace(/@"/g, '')           // PowerShell multiline start hatao
            .replace(/"@/g, '')           // PowerShell multiline end hatao
            .replace(/>>/g, '')           // Terminal redirection symbols hatao
            .replace(/␦/g, '')            // Ajeeb symbols jo copy-paste se aate hain
            .replace(/\r?\n|\r/g, ' ')    // Newlines ko spaces mein badlo taaki AI confuse na ho
            .replace(/\s+/g, ' ')         // Double spaces ko single space banao
            .trim();

        // 3. Advanced Prompt Engineering
        const finalPrompt = `
        ACT AS: Senior Software Architect.
        TASK: Create a production-ready coding project for: "${cleanUserPrompt}".

        RETURN A JSON ARRAY OF OBJECTS:
        [{"filename": "string", "code": "string"}]

        STRICT RULES:
        1. AUTO-DETECT LANGUAGE & TECH: 
            - If the request mentions "Typescript" or ".ts/.tsx", use TypeScript strictly.
            - If it mentions React/Components, use React (JSX/TSX).
            - For DSA/Logic, choose Java, Python, or C++ based on context.
        2. TYPESCRIPT RULES: If using TypeScript, define proper Interfaces/Types for Props and State.

        3. Return ONLY a valid JSON array: [{"filename": "string", "code": "string"}]

        4. ⛔ NO COMMENTS: Do not include // or /* */ lines.
        5. ⛔ NO MARKDOWN: Do not wrap in \`\`\`json. Return RAW JSON string only.
        6. Include all necessary boilerplate (e.g. package.json, pom.xml, etc.).
        7. If prompt implies multiple files, create a proper file structure with correct imports/exports.
        8. 🚫 NO BLOAT: In package.json, include ONLY the absolute minimum dependencies to run the app (e.g., react, react-dom, react-scripts). 
        9. ❌ REMOVE FALTU LIBRARIES: Strictly do NOT include @testing-library/*, web-vitals, eslintConfig, or reportWebVitals.
        10. REACT RULES: If using React, always use functional components with hooks (useState, useEffect).
        12. 🧑‍💻 FULL SOURCE CODE: The 'code' field must contain the complete source code for the file, including all necessary imports, exports, and boilerplate. Do not return partial code snippets.
        13. 🎯 CONTEXTUAL ONLY: Scrutinize the prompt. If it's a simple app, do NOT add router or state management. Only add 'react-router-dom', 'axios', etc., if the specific feature is requested.
        14. IMPORTANT: I need 'Pretty-Printed' code. Use multi-line formatting. Single-line code is strictly forbidden.

        
        IMPORTANT: The 'code' string must include proper indentation (spaces/tabs) and newlines so it is human-readable after being written to a file.
        
        OUTPUT JSON ONLY:
        `;

        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${API_KEY}`;
        
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
                maxOutputTokens: 8192,
                response_mime_type: "application/json",
                response_schema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            filename: { type: "STRING" },
                            code: { 
                                type: "STRING", 
                                description: "CRITICAL: Full source code. Use ACTUAL newlines (\\n) and 2-space indentation. DO NOT return a single-line string. Every statement must be on a new line." 
                            }
                        },
                        required: ["filename", "code"]
                    }
                }
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
       // let rawText = data.candidates[0].content.parts[0].text;
        
        // Markdown hatana (```json ... ```)
       // const cleanJson = rawText.replace(/```json|```/g, '').trim();

        // 7. Validation (Check karo JSON sahi hai ya nahi)
        try {
            const rawText = data.candidates[0].content.parts[0].text;
            const parsedFiles = JSON.parse(rawText);
            
            // ✅ SUCCESS: Clean data bhejo
            return res.status(200).json({ 
                success: true, 
                files: parsedFiles 
            });

        } catch (jsonError) {
            console.error("JSON Parse Fail:", data.candidates[0].content.parts[0].text);
            return res.status(500).json({ 
                error: "AI generated invalid JSON. Please try again.",
                raw_response: data.candidates[0].content.parts[0].text
            });
        }

    } catch (error) {
        console.error("Server Crash Log:", error.message);
        res.status(500).json({ error: error.message });
    }
}