// IMPORTANT: This file needs node-fetch version 2. To install it, run:
// npm install node-fetch@2

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY not found in environment variables.");
        return { statusCode: 500, body: 'API key not found.' };
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const { systemPrompt, userQuery, isJson, history } = JSON.parse(event.body);

        let contents = history || [];
        if (userQuery && history.length === 0) {
            contents.push({ role: 'user', parts: [{ text: userQuery }] });
        }
       
        const payload = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            // **NEW: Adding safety settings to make the API more reliable**
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE"
                }
            ]
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
            // **NEW: More detailed logging**
            console.error('Gemini API Error Response:', { status: response.status, body: errorText });
            return { statusCode: response.status, body: `Error from Gemini API: ${errorText}` };
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            console.error('Invalid response structure from Gemini:', data);
            return { statusCode: 500, body: 'Received an invalid or empty response from the AI.' };
        }
        
        const text = data.candidates[0].content.parts[0].text;
        const responsePayload = isJson ? JSON.parse(text) : text;

        return {
            statusCode: 200,
            headers: { 'Content-Type': isJson ? 'application/json' : 'text/plain' },
            body: JSON.stringify(responsePayload),
        };

    } catch (error) {
        console.error('Proxy Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal server error occurred in the proxy function.' }),
        };
    }
};

