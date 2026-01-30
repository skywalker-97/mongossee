#!/usr/bin/env node

const fs = require('fs'); // Node.js File System
const path = require('path'); // Node.js Path module
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// 👇 IMP: Yahan apni Vercel App ka link daalna hoga (Deploy karne ke baad milega)
// Filhal ye placeholder rakhein, baad me edit karke update kar dena.
const SERVER_URL = "https://mongossee.vercel.app/api/server";


/**
 * Generates a full project structure based on a prompt.
 * @param {string} prompt - The user's project request.
 * @param {string} directoryName - The name of the folder to create the project in.
 */
async function generateProject(prompt, directoryName) {
  
// ⚠️ CHANGE 3: Hum ab Google ko nahi, apne Server ko call kar rahe hain
    // Note: 'newPrompt' wala logic ab Server (api/server.js) ke paas hai,
    // isliye yahan se hata diya taki code simple rahe.

    const body = {
        prompt: prompt // Sirf user ka prompt bhej rahe hain
    };

    try {
        console.log(`Code Running in Expresss`);

        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            // Agar server down hai ya error hai
            const errorText = await response.text();
            console.error('❌ Server Error:', response.status, errorText);
            throw new Error(`Server request failed with status ${response.status}`);
        }

        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text;

        // --- NEW JSON PARSING & FILE CREATION LOGIC ---
       // console.log("Building project...");

        // Clean up potential markdown fences from the AI's response
        if (responseText.startsWith("```json")) {
            responseText = responseText.substring(7, responseText.length - 3).trim();
        }

        let files;
        try {
            files = JSON.parse(responseText);
            if (!Array.isArray(files)) throw new Error("AI did not return a JSON array.");
        } catch (parseError) {
            console.error("❌ ERROR: Failed to parse the AI's response. The response was not valid JSON.");
            console.error("Raw AI Response:", responseText);
            return;
        }

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
        '$0 <prompt>', // The default command
        'Generates a full project structure from a text prompt.',
        (yargs) => {
            return yargs
                .positional('prompt', {
                    describe: 'The project you want to generate',
                    type: 'string',
                })
                .option('directory', { // Replaces the old 'output' flag
                    alias: 'd',
                    describe: 'The name of the new directory to create the project in',
                    type: 'string',
                    demandOption: true, // This flag is now required
                });
        },
        (argv) => {
            
            generateProject(argv.prompt, argv.directory);
        }
    )
    .demandCommand(1, 'Please provide a prompt.')
    .parse();