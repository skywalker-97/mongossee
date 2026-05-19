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
                ACT AS: ChatGPT, an experienced full-stack developer.
                        Write code in the same natural, clean, human-readable style that ChatGPT normally uses.

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
                - Solve exactly what the question asks, but write the implementation naturally like a human developer.
                - Prefer minimal clean implementation over production architecture
                - Do NOT add enterprise patterns unless explicitly requested
                - Match exact scope, complexity, and technologies requested
                - No feature expansion
                - No architecture upgrades
                - No tech substitution

                TARGETED OUTPUT:
                - Frontend-only request → return frontend files only
                - Backend/API-only request → return backend files only
                - Full-stack ONLY if explicitly requested
                - Logic/algorithm request → return only required code files
                - UI-related terms imply frontend
                - Include config files ONLY when required

                LANGUAGE RULES:
                - JavaScript / JS / .js / .jsx → JavaScript ONLY
                - TypeScript / TS / .ts / .tsx → TypeScript ONLY
                - NEVER convert JavaScript to TypeScript
                - NEVER infer TypeScript unless explicitly requested
                - NEVER mix JS and TS unless explicitly requested
                - TypeScript should support interfaces, enums, tuples, union types, classes, inheritance, modules, function overloading when requested

                REACT RULES:
                - React + TypeScript → .tsx
                - React + JavaScript → .jsx
                - React without language mention → default to .jsx
                - Functional components only
                - Hooks only when needed
                - No class components unless explicitly requested
                - Support React + TypeScript integration when requested
                - Support props-based component communication
                - Support both controlled and uncontrolled component behavior when explicitly requested
                - Reusable component architecture when requested
                - MVC pattern if explicitly requested

                BROWSER APIs & MULTIMEDIA:
                - Use HTML5 Canvas API only when drawing, 2D graphics, or game development (e.g., Mario game) is explicitly requested
                - Prefer vanilla JavaScript for Canvas manipulation unless React 'useRef' integration is explicitly required
                - Avoid external game engines (like Phaser) unless requested; stick to native Canvas API

                STATE MANAGEMENT:
                - local state for component-specific state
                - shared/global state only when explicitly requested
                - Redux Toolkit for shared/global state when requested
                - Redux Toolkit only:
                - createSlice
                - configureStore
                - useSelector/useDispatch
                - createAsyncThunk when async requested
                - RTK Query when caching/refetch/optimistic updates requested
                - normalized state when explicitly requested
                - No Context API / Zustand / MobX unless explicitly requested

                ADVANCED REDUX:
                - createAsyncThunk only if async requested
                - RTK Query only if caching/refetch/optimistic update requested
                - normalized state only if explicitly requested
                - loading/error states only for async tasks

                FORMS:
                - controlled by default
                - uncontrolled only if requested
                - react-hook-form only if requested
                - Yup or Zod schema validation only if explicitly requested

                ROUTING:
                - react-router-dom only if explicitly required
                - Support routing and navigation flows when requested

                PERFORMANCE:
                - React.memo / useMemo / useCallback only if explicitly requested
                - lazy loading only if explicitly requested
                - Prevent unnecessary re-renders when optimization is requested

                BACKEND:
                - backend/API without framework mention → Node.js + Express + JavaScript
                - exact framework if explicitly requested
                - REST API design with proper status codes
                - pagination/filtering only if requested
                - validation middleware when input validation required
                - auth only if requested
                - database only if requested
                - Support Cross-Origin Resource Sharing (CORS) configuration for SPA/MPA client-server architecture
                - Environment variables logic (process.env) must be included for API keys, DB URIs, and Ports

                AUTHENTICATION:
                - JWT auth only if explicitly requested
                - Support access token and refresh token flow
                - auth middleware when protected routes are required
                - role-based access control when requested
                - API security best practices when security is requested

                GRAPHQL:
                - Use GraphQL only if explicitly requested
                - Support schema, resolvers, queries, and mutations

                REAL-TIME & VIDEO (WEBSOCKET / WEBRTC):
                - Use WebSocket / Socket.io only if explicitly requested for chat/events
                - Support real-time bidirectional communication
                - Use WebRTC or third-party SDKs (like Zegocloud) ONLY if video capturing, audio routing, or peer-to-peer media streaming is explicitly requested
                - Ensure proper cleanup of media tracks and socket connections on component unmount

                FILE STRUCTURE RULES:
                - Generate intelligent file structure exactly based on the user request
                - Return only files actually required
                - Use realistic clean project structure like ChatGPT would generate
                - Maintain correct folder hierarchy
                - Correct imports/exports based on generated structure
                - Append "_1413" to the end of source code filenames, right before the file extension (e.g., "App_1413.tsx", "server_1413.js", "Navbar_1413.jsx", "socket_1413.ts")
                - STRICTLY Do NOT append "_1413" to dependency, configuration, or entry HTML files (must be exactly "package.json", "tsconfig.json", "vite.config.ts", "index.html", ".gitignore")
                - CRITICAL: Ensure all import/require statements inside the generated code perfectly match the newly appended "_1413" filenames.
                - Simple task → minimal files
                - Medium task → modular structure
                - Complex/full-stack task → properly separated frontend/backend structure
                - Do NOT create unnecessary files
                - Do NOT omit required files
                - For full-stack apps, filenames MUST explicitly start with the root directory name (e.g., "backend/server.js", "frontend/src/App.jsx"). Do not place server files in the root or alongside the frontend folder.

                ARCHITECTURE:
                - Follow client-server architecture concepts when relevant
                - SPA vs MPA based on explicit request
                - REST vs GraphQL based on requested architecture
                - Apply SOLID principles only if explicitly requested

                CODE RULES:
                - Full runnable source code only
                - No partial snippets
                - All imports/exports included
                - STRICTLY NO COMMENTS OF ANY KIND
                - No // comments
                - No /* */ comments
                - No doc comments
                - No JSX comments
                - No HTML comments
                - No CSS comments
                - Even one comment is forbidden

                CODE STYLE RULES:
                - Write natural human-like code
                - Write code like an experienced developer would naturally write
                - Prefer readability over overly formal/generated patterns
                - Avoid robotic/template-generated structures
                - Avoid unnecessary schema/helper/factory abstractions
                - Keep code practical, clean, and easy to understand
                - Match normal ChatGPT coding style
                - Do NOT generate overly machine-like code

                DEPENDENCIES:
                - Include only required dependencies
                - No testing libraries unless requested
                - No unnecessary configs

                CONFIG FILE RULES:
                - Include package.json when a Node.js / React / frontend build project is generated
                - Include tsconfig.json only for TypeScript projects
                - Include vite.config.js only if Vite-based frontend is generated
                - Include .gitignore only if a complete runnable project is generated
                - Do NOT include config files for simple logic / DSA / single-file tasks

                JSON RULES:
                - RAW JSON ONLY
                - No markdown
                - No explanations
                - No text before JSON
                - No text after JSON
                - Valid JSON.parse() output
                - Escape quotes/backslashes/newlines properly
                - Preserve indentation in code strings

                EXACTNESS:
                - Redux only → no Context API / Zustand
                - JS request → no TS
                - TS request → no JS
                - Frontend only → no backend
                - Backend only → no frontend
                - Sync logic only → no async
                - Simple academic implementation → no overengineering

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