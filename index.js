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
        prompt: prompt // Ye wahi prompt hai jo user terminal mein likhega
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
            console.error(`\n Server Error: ${errorMessage}`);
            if (data.raw_response) {
               // console.log("Raw Output (Debug):");
                try {
                    // AI ka response agar markdown mein ho toh clean karke parse karein
                    const cleanRaw = data.raw_response.replace(/```json|```/g, "").trim();
                    const prettyJson = JSON.stringify(JSON.parse(cleanRaw), null, 2);
                    console.log(prettyJson);
                } catch (e) {
                    //console.log("Raw Response:", data.raw_response);
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