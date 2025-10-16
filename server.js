import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API routes
app.get("/api", (req, res) => {
  res.json({
    message: "FMS Proxy Server is running! 🚀",
    status: "active",
    endpoints: {
      "GET /api": "This message",
      "GET /api/fms": "API info", 
      "POST /api/fms": "Proxy to Google Apps Script"
    },
    note: "Use POST /api/fms for actual API calls"
  });
});

// GET route for API info
app.get("/api/fms", (req, res) => {
  res.json({
    message: "FMS API Proxy Server",
    status: "running",
    endpoints: {
      POST: "/api/fms - Proxy to Google Apps Script"
    },
    note: "This is a proxy server. Use POST requests with action payloads."
  });
});

app.post("/api/fms", async (req, res) => {
  const scriptUrl = "https://script.google.com/macros/s/AKfycbwD21RPP8qNlFmhVXoiwzw9MtaKTZcBrTmqngdBKvX7Pl-x_T9GXxhL7M6obgvNJppPvg/exec";
  const response = await fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify(req.body),
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  res.json(data);
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3000, () => console.log("Proxy running on port 3000"));
