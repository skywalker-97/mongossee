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
        TASK: Create a coding project that matches the exact scope, complexity, and technology requirements of: "${cleanUserPrompt}".

        RETURN A JSON ARRAY OF OBJECTS:
        [{"filename": "string", "code": "string"}]

        STRICT RULES:

        TARGETED OUTPUT:
            - If the request is frontend-only, return only frontend files.
            - If the request is backend/API-only, return only backend files.
            - If the prompt explicitly requests full-stack functionality, generate frontend + backend + database as required.
            - If the user asks for specific logic/algorithm in TypeScript without UI/frontend mention, return ONLY pure TypeScript files (.ts).
            - If the prompt describes forms, pages, components, UI interactions, buttons, dashboards, cart, login/logout, or visual behavior, frontend/UI is clearly implied.
            - For Node/TypeScript projects, include package.json and tsconfig.json.
        
        1. AUTO-DETECT LANGUAGE & TECH:
            - Detect whether the request is frontend, backend, full-stack, API, CLI, DSA, or pure logic.
            - If TypeScript is mentioned, use TypeScript strictly.
            - If React is requested, use the exact requested language (.jsx or .tsx).
            - If frontend/UI is requested without a language, choose the simplest appropriate frontend stack.
            - If backend/API/auth/database is mentioned, use the simplest appropriate backend stack unless a specific framework is requested.
            - If database is implied, choose PostgreSQL, MongoDB, or SQLite based on context.
            - For authentication, use JWT/session-based auth only if required.
            - For logic/algorithm tasks, use the explicitly requested language; otherwise choose the simplest appropriate language.
            - If the user explicitly specifies .js/.jsx, use JavaScript strictly.
            - If the user explicitly specifies .ts/.tsx, use TypeScript strictly.
            
        2. TYPESCRIPT RULES:
            - Define proper interfaces, types, DTOs, and typings wherever appropriate.

        3. Return ONLY a valid JSON array: [{"filename": "string", "code": "string"}]

        4. ⛔ NO COMMENTS: Do not include // or /* */ lines.
        5. ⛔ NO MARKDOWN: Do not wrap in \`\`\`json. Return RAW JSON string only.
        6. Include all necessary boilerplate (e.g. package.json, pom.xml, etc.).
        7. If prompt implies multiple files, create a proper file structure with correct imports/exports.
        8. NO BLOAT:
            - Include ONLY required dependencies.
            - React projects: minimal frontend deps only.
            - Backend projects: minimal server/database deps only.
            - Full-stack projects: keep frontend/backend dependencies separated.
        9. ❌ REMOVE FALTU LIBRARIES: Strictly do NOT include @testing-library/*, web-vitals, eslintConfig, or reportWebVitals.
        10. REACT RULES:
            - Use functional components.
            - Use hooks only when needed.
       
        11. 🧑‍💻 FULL SOURCE CODE: The 'code' field must contain the complete source code for the file, including all necessary imports, exports, and boilerplate. Do not return partial code snippets.

        12. 🎯 CONTEXTUAL ONLY:
             - Do NOT add router, state management, libraries, or extra architecture unless explicitly requested or clearly required by the prompt.
        13. IMPORTANT:
            - The "code" field must preserve escaped newlines (\n) and indentation so that when parsed and written to a file, the source code is properly formatted.
        14. JSON SAFETY:
            - Escape quotes, backslashes, and newlines properly inside the "code" string.
            - Output must be valid parseable JSON.
        15. FILE STRUCTURE:
            - Use realistic production-grade folder structure and naming conventions.
        16. STRICT PROMPT ALIGNMENT:
            - Follow the exact user requirements.
            - Do NOT add backend, database, authentication, routing, styling frameworks, async logic, or extra architecture unless explicitly requested or clearly required.
            - Match the requested file names, technologies, language, and complexity exactly.
        17. LIBRARY-SPECIFIC RULES:
            - If Redux Toolkit is requested, use Redux Toolkit strictly.
            - Use synchronous reducers only unless async behavior is explicitly requested.

        
        IMPORTANT: The 'code' string must include proper indentation (spaces/tabs) and newlines so it is human-readable after being written to a file.
        
        OUTPUT JSON ONLY:
        `;

        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;
        
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