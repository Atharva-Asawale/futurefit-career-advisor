// IMPORTANT: This is a temporary diagnostic version to test the API connection.
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error("CRITICAL: GEMINI_API_KEY not found.");
        return { statusCode: 500, body: 'API key not found.' };
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    
    // --- START OF SIMPLIFIED TEST ---
    try {
        // We are ignoring the user's form input for this test.
        // We are sending a very simple, non-JSON request.
        const simplePrompt = "Tell me a fun fact about India in one sentence.";

        const payload = {
            contents: [{ parts: [{ text: simplePrompt }] }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error (Simple Test):', { status: response.status, body: errorText });
            return { statusCode: response.status, body: `Error from Gemini API: ${errorText}` };
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
             return { statusCode: 500, body: 'Simple test failed: Received an empty response from the AI.' };
        }
        
        const text = data.candidates[0].content.parts[0].text;
        
        // IMPORTANT: We will return a fake but valid JSON structure so the frontend doesn't break.
        // The real career title will be replaced by the fun fact.
        const fakeJsonForFrontend = {
            best_match_career: {
                title: `API TEST SUCCESSFUL: ${text}`,
                description: "The simple API call worked fast. This means the problem is the complexity of the original prompt.",
                market_scope_india: "N/A",
                learning_roadmap: [],
                specific_courses: []
            },
            alternative_career_paths: []
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fakeJsonForFrontend),
        };

    } catch (error) {
        console.error('Proxy Function Error (Simple Test):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Simple test failed: An error occurred in the proxy function.' }),
        };
    }
    // --- END OF SIMPLIFIED TEST ---
};

