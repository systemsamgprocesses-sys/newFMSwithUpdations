# FMS Backend Server

This is the backend proxy server for the FMS Management System. It acts as a middleware between the React frontend and Google Apps Script API.

## Features

- **CORS Proxy**: Handles cross-origin requests to Google Apps Script
- **Large Payload Support**: Supports up to 10MB payloads for file uploads
- **Static File Serving**: Serves the built React application
- **Error Handling**: Comprehensive error handling and logging
- **SPA Support**: Fallback routing for single-page application

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## Deployment on Render

1. Connect your GitHub repository to Render
2. Set the **Root Directory** to `server`
3. The `render.yaml` file will automatically configure the build and start commands
4. Environment variables are pre-configured in `render.yaml`

## Environment Variables

- `NODE_ENV`: Set to `production` in production
- `PORT`: Server port (default: 3000)

## API Endpoints

### GET /api
Health check endpoint - returns server status and available endpoints

### GET /api/fms
Returns API information

### POST /api/fms
Main proxy endpoint - forwards requests to Google Apps Script
- Accepts JSON payload with `action` field
- Supports file uploads (base64 encoded)
- Max payload size: 10MB
- Timeout: 60 seconds

## Project Structure

```
server/
├── server.js          # Express server
├── package.json       # Server dependencies
├── render.yaml        # Render deployment config
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Notes

- The server serves the frontend from the `../dist` directory
- Make sure to build the frontend before deploying
- The build command in `render.yaml` handles both frontend build and server setup

