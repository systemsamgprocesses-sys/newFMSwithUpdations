import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
// Increase payload limit to handle file uploads (base64 encoded files can be large)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from parent dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

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
  const scriptUrl = "https://script.google.com/macros/s/AKfycbxn7TQK1xKKLTUg2SyQMuwHIRocisrynvH3PBVibmAi5Bslm3qJgpTlwNDwp_LadXqtuQ/exec";
  
  try {
    const bodySize = Buffer.byteLength(JSON.stringify(req.body));
    console.log(`📦 Request received: ${req.body.action || 'unknown'} | Size: ${(bodySize / 1024 / 1024).toFixed(2)}MB`);
    
    // Check if payload is too large
    if (bodySize > 10 * 1024 * 1024) { // 10MB
      console.error(`❌ Payload too large: ${(bodySize / 1024 / 1024).toFixed(2)}MB`);
      return res.status(413).json({
        success: false,
        message: `Request payload too large (${(bodySize / 1024 / 1024).toFixed(2)}MB). Max 10MB allowed.`
      });
    }
    
    // Increase timeout for large file uploads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(scriptUrl, {
      method: "POST",
      body: JSON.stringify(req.body),
      headers: { 
        "Content-Type": "application/json",
        "Content-Length": bodySize.toString()
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`❌ Google Apps Script error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        success: false,
        message: `Google Apps Script error: ${response.statusText}`
      });
    }
    
    const data = await response.json();
    console.log(`✅ Request completed: ${req.body.action || 'unknown'}`);
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while processing request'
    });
  }
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FMS Proxy Server running on port ${PORT}`);
  console.log(`📊 Max payload size: 10MB`);
  console.log(`⏱️  Request timeout: 60 seconds`);
});

