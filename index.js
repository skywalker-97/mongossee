#!/usr/bin/env node

const fs = require('fs'); 
const path = require('path'); 
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');


const SERVER_URL = "https://mongossee.vercel.app/api/server";


/**
 * Generates a full project structure based on a prompt.
 * @param {string} prompt - The user's project request.
 * @param {string} directoryName - The name of the folder to create the project in.
 */
async function generateProject(prompt, directoryName) {
  

    const body = {
        prompt: `
        TASK: Generate a coding project based on this user request: "${prompt}"
        
        STRICT TECHNICAL CONSTRAINTS (Follow for every project):
        1. AUTO-DETECT LANGUAGE & TECH: 
            - If the request mentions "Typescript" or ".ts/.tsx", use TypeScript strictly.
            - If it mentions React/Components, use React (JSX/TSX).
            - For DSA/Logic, choose Java, Python, or C++ based on context.
        2. TYPESCRIPT RULES: If using TypeScript, define proper Interfaces/Types for Props and State.
        3. 🎯 CONTEXTUAL ONLY: Scrutinize the prompt. If it's a simple app, do NOT add router or state management. Only add 'react-router-dom', 'axios', etc., if the specific feature is requested.
        4. 🚫 NO BLOAT: In package.json, include ONLY the absolute minimum dependencies to run the app (e.g., react, react-dom, react-scripts). 
        5. ❌ REMOVE FALTU LIBRARIES: Strictly do NOT include @testing-library/*, web-vitals, eslintConfig, or reportWebVitals.
        6. REACT RULES: If using React, always use functional components with hooks (useState, useEffect).

        7. 🧠 SMART LOGIC: If the prompt says "Logic", "Algorithm", or "DSA", generate only the core logic without UI or framework code
        8. 🧱 COMPONENT STRUCTURE: If the prompt mentions "component", "ui", or "frontend", build a complete component with proper imports, exports, and structure.

        9. ⛔ ZERO COMMENTS: Return strictly functional code. No // or /* */ comments, and no explanations.

        10. 📁 ARCHITECTURE: If the prompt mentions Parent/Child or Props, strictly follow React best practices (state in parent, props to child, arrow functions for events).

        11. 📄 FORMAT: Return ONLY a valid JSON array of objects: [{"filename": "string", "code": "string"}]. 
        
        12. 🚫 NO MARKDOWN: Do not wrap the response in \`\`\`json blocks.
        13. 🧹 CLEAN CODE: Ensure the 'code' string has proper indentation (spaces/tabs) and newlines so it is human-readable after being written to a file. Single-line code is not acceptable.
        14. IMPORTANT: I need 'Pretty-Printed' code. Use multi-line formatting. Single-line code is strictly forbidden.
        15. 🛠️ BOILERPLATE: Include all necessary boilerplate files (e.g. package.json for Node.js, pom.xml for Java, etc.) based on the detected language and framework.
        16. 🧑‍💻 FULL SOURCE CODE: The 'code' field must contain the complete source code for the file, including all necessary imports, exports, and boilerplate. Do not return partial code snippets.
        `
    };

    try {
        console.log(`Code Running in Expresss`);

        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        // 1. Check Server Success
        
        if (!response.ok || !data.success) {
            const errorMessage = data.error || 'Unknown Server Error';
            console.error(`\n❌ Server Error: ${errorMessage}`);
            if (data.raw_response) {
                console.log("Raw Output (Debug):");
                try {
                    // AI ka response agar markdown mein ho toh clean karke parse karein
                    const cleanRaw = data.raw_response.replace(/```json|```/g, "").trim();
                    const prettyJson = JSON.stringify(JSON.parse(cleanRaw), null, 2);
                    console.log(prettyJson);
                } catch (e) {
                    console.log("Raw Response:", data.raw_response);
                }
            }
            return; // Stop here
        }

        // 2. Get Files Directly (No Parsing Needed)
        
        const files = data.files;

        if (!Array.isArray(files)) {
            throw new Error("Invalid response format: 'files' is not an array.");
        }

        // --- FILE CREATION LOGIC ---

        // Create the main project directory
        fs.mkdirSync(directoryName, { recursive: true });
        console.log(``);

        // Loop through the files array and create each file
        for (const file of files) {
            const filePath = path.join(directoryName, file.filename);
            const fileDir = path.dirname(filePath);

            // Create subdirectories if they don't exist
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }

            let formattedCode = file.code;

            if (typeof formattedCode === 'string') {
                    formattedCode = formattedCode
                        .replace(/\\\\"/g, '"')    // 1. Triple escaped quotes (\\") pehle
                        .replace(/\\"/g, '"')      // 2. Normal escaped quotes (\")
                        .replace(/\\r/g, '')       // 3. Carriage returns hatao
                        .replace(/\\n/g, '\n')     // 4. Newlines (Actual line breaks) ko restore karo 🚀
                        .replace(/\\t/g, '  ')     // 5. Tabs ko 2 spaces banao
                        .replace(/\\{2,}/g, '\\')  // 6. Multiple backslashes ko handle karo
                        .replace(/\\\\/g, '\\');   // 7. Generic backslashes last mein
                }

                // 2. ✨ JSON Pretty-Print Fix:
                // Agar file .json hai, toh usey dubara parse karke sundar format mein badlo
                if (file.filename.endsWith('.json')) {
                    try {
                        const jsonObject = JSON.parse(formattedCode);
                        formattedCode = JSON.stringify(jsonObject, null, 2);
                    } catch (e) {
                        // Agar parse fail ho jaye toh purana formatted code hi rehne do
                        //console.log(` ${file.filename}`);
                    }
                }

            // Write the code to the file
            fs.writeFileSync(filePath, formattedCode);
            //console.log(`Created file: ${filePath}`);
        }

       // console.log(`\n Project "${directoryName}" created successfully!`);

    } catch (error) {
        console.error(' An error occurred:', error.message);
    }
}

// --- NEW YARGS SETUP ---
yargs(hideBin(process.argv))
    .command(
        '$0 <prompt>', 
        'Generates a full project structure from a text prompt.',
        (yargs) => {
            return yargs
                .positional('prompt', {
                    describe: 'The project you want to generate',
                    type: 'string',
                })
                .option('directory', { 
                    alias: 'd',
                    describe: 'The name of the new directory to create the project in',
                    type: 'string',
                    demandOption: true, 
                });
        },
        (argv) => {
            
            generateProject(argv.prompt, argv.directory);
        }
    )
    .demandCommand(1, 'Please provide a prompt.')
    .parse();