// IMPORTANT: This file needs node-fetch version 2. To install it, run:
// npm install node-fetch@2

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Get the API key from the environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: 'API key not found.' };
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const { systemPrompt, userQuery, isJson, history } = JSON.parse(event.body);

        let contents = history || [];
        if (userQuery) {
            // For main query and resume booster, userQuery is the main content.
            // For interview feedback and next question, the history contains the context.
             if (history.length === 0) {
                 contents.push({ role: 'user', parts: [{ text: userQuery }] });
            }
        }
       

        const payload = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        if (isJson) {
            payload.generationConfig = { responseMimeType: "application/json" };
        }
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return { statusCode: response.status, body: errorText };
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        const responsePayload = isJson ? JSON.parse(text) : text;

        return {
            statusCode: 200,
            headers: { 'Content-Type': isJson ? 'application/json' : 'text/plain' },
            body: JSON.stringify(responsePayload),
        };

    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal server error occurred.' }),
        };
    }
};

