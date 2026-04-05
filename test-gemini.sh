#!/bin/bash
source /Users/finley/venture-crm/.env.local
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" -H "Content-Type: application/json" -d '{"contents":[{"parts":[{"text":"Say hello in one word"}]}]}'
