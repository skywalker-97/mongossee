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
        3. TYPESCRIPT RULES: If using TypeScript, define proper Interfaces/Types for Props and State. No "any" type.
        4. ⛔ NO EXTRA BLOAT: In package.json, include ONLY strictly necessary dependencies (e.g., react, react-dom, react-scripts). 
        5. ❌ REMOVE FALTU STUFF: Do NOT include @testing-library, web-vitals, or eslintConfig. I want a clean, minimal package.json.
        6. ⛔ ZERO COMMENTS: Return strictly functional code. No // or /* */ comments, and no explanations.
        7. 📁 ARCHITECTURE: If the prompt mentions Parent/Child or Props, strictly follow React best practices (state in parent, props to child, arrow functions for events).
        8. 📄 FORMAT: Return ONLY a valid JSON array of objects: [{"filename": "string", "code": "string"}]. 
        9. 🚫 NO MARKDOWN: Do not wrap the response in \`\`\`json blocks.
        10. IMPORTANT: I need 'Pretty-Printed' code. Use multi-line formatting. Single-line code is strictly forbidden.
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

            const formattedCode = file.code.replace(/\\n/g, '\n');

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