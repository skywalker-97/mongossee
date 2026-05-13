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

        const finalPrompt = `
                ACT AS: Senior React/Redux Exam Solution Generator.

                TASK:
                Create an exact implementation matching this academic coding question:
                "${cleanUserPrompt}"

                RETURN FORMAT:
                [
                {
                    "filename": "string",
                    "code": "string"
                }
                ]

                STRICT RULES:

                ACADEMIC MODE:
                - Solve exactly what the question asks.
                - Prefer minimal clean implementation over production architecture.
                - Do NOT add enterprise patterns unless explicitly requested.
                - For React/Redux exam questions, generate only the required slices, store, and components.
                - Match exact scope, complexity, and technologies requested.
                - No feature expansion.

                TARGETED OUTPUT:
                - Frontend-only request → return frontend files only
                - Backend/API-only request → return backend files only
                - Full-stack ONLY if explicitly requested
                - Logic/algorithm request → return only required code files
                - UI-related terms (forms, buttons, pages, cart, login, dashboard, navigation, components) imply frontend
                - Include config files ONLY when required by the requested stack

                LANGUAGE RULES:
                - If user explicitly says JavaScript / JS / .js / .jsx → use JavaScript ONLY
                - If user explicitly says TypeScript / TS / .ts / .tsx → use TypeScript ONLY
                - NEVER convert JavaScript requests into TypeScript
                - NEVER infer TypeScript unless explicitly requested

                REACT LANGUAGE RULE:
                - React + explicit TypeScript → .tsx
                - React + explicit JavaScript → .jsx
                - React without language mention → default to .jsx

                FRONTEND RULE:
                - React frontend without language mention → JavaScript (.jsx)
                - Vanilla frontend without framework mention → HTML/CSS/JS

                BACKEND RULE:
                - Backend/API without framework mention → Node.js + Express + JavaScript
                - If framework explicitly requested, use exact framework only

                DATABASE RULE:
                - Add database ONLY if explicitly requested or clearly required

                AUTH RULE:
                - Add authentication ONLY if explicitly requested

                LOGIC RULE:
                - Logic/algorithm tasks → use explicitly requested language
                - Otherwise default to JavaScript

                REDUX RULES:
                - If Redux Toolkit is requested:
                - use Redux Toolkit strictly
                - use createSlice
                - use configureStore
                - use useSelector/useDispatch if UI is involved
                - do NOT replace with Context API, Zustand, MobX, or plain Redux
                - Use synchronous reducers unless async behavior is explicitly requested
                - Use asyncThunk / RTK Query ONLY if explicitly requested

                FORMS RULE:
                - If forms are requested:
                - use controlled components by default
                - use react-hook-form ONLY if explicitly requested

                ROUTING RULE:
                - Use react-router-dom ONLY if explicitly requested or clearly required

                PERFORMANCE RULE:
                - Use React.memo / useMemo / useCallback ONLY if explicitly requested

                REACT RULES:
                - Functional components only
                - Hooks only when needed
                - No class components unless explicitly requested

                FILE STRUCTURE:
                - Keep structure proportional to requested complexity
                - Do NOT add extra folders
                - Minimal clean academic structure

                DEPENDENCY RULE:
                - Include ONLY required dependencies
                - No unnecessary libraries
                - No testing libraries unless explicitly requested
                - Do NOT include:
                @testing-library/*
                web-vitals
                eslintConfig
                reportWebVitals

                CODE RULES:
                - Full runnable source code only
                - No partial snippets
                - Include all required imports/exports
                - STRICTLY NO COMMENTS OF ANY KIND
                - Do NOT include:
                // comments
                /* block comments */
                /** doc comments */
                JSX comments
                HTML comments
                CSS comments
                - Even a single comment is forbidden
                - No markdown
                - No explanations
                - JSON output only

                JSON SAFETY:
                - Escape quotes properly
                - Escape backslashes properly
                - Escape newlines properly
                - Response must be valid JSON.parse() output
                - No text before JSON
                - No text after JSON

                EXACTNESS RULE:
                - Redux only → do not add Context API / Zustand
                - JavaScript → do not return TypeScript
                - Frontend only → do not add backend
                - Backend only → do not add frontend
                - Synchronous logic only → do not add async code
                - Simple academic implementation → do not over-engineer

                IMPORTANT:
                The "code" string must preserve proper indentation and escaped newlines so that writing files produces readable source code.

                OUTPUT JSON ONLY.
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