#!/usr/bin/env node

const fs = require('fs'); // Node.js File System
const path = require('path'); // Node.js Path module
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
        prompt: prompt + " . IMPORTANT: Return strictly code only. Do not include any comments, docstrings, or explanations inside the code files." 
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
        // Ab server khud bata dega ki success hua ya fail
        if (!response.ok || !data.success) {
            const errorMessage = data.error || 'Unknown Server Error';
            console.error(`\n❌ Server Error: ${errorMessage}`);
            if (data.raw_response) {
                console.log("Raw Output (Debug):", data.raw_response);
            }
            return; // Stop here
        }

        // 2. Get Files Directly (No Parsing Needed)
        // Server ne saaf-suthra array bheja hai
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

            // Write the code to the file
            fs.writeFileSync(filePath, file.code);
            //console.log(`Created file: ${filePath}`);
        }

       // console.log(`\n🎉 Project "${directoryName}" created successfully!`);

    } catch (error) {
        console.error('❌ An error occurred:', error.message);
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