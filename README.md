 # examnova.ai

A React-based frontend for an AI-powered intelligent examination platform.

## Available scripts

- npm install
- npm run dev:full
- npm run build

`npm run dev:full` starts both the Vite frontend and the Express/MongoDB API.
The login pages require the API to be running on port 5000; starting only `npm run dev`
starts the frontend, which makes authentication requests fail through the local API proxy.
