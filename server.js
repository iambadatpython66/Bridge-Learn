const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
// Load default .env first
require('dotenv').config();
// If key still missing, try AI.env as a fallback
if (!process.env.OPENAI_API_KEY) {
  require('dotenv').config({ path: 'AI.env' });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }
    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || '';
    res.json({ message: aiMessage, raw: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const hostname = '0.0.0.0'; // Listen on all interfaces so other devices can access
const port = 3000;

const server = http.createServer((req, res) => {
  // Always serve the main HTML regardless of the requested path
  const filePath = path.join(__dirname, 'BridgeLearn.html');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error loading BridgeLearn.html');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
});

function getLocalIpAddresses() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

server.listen(port, hostname, () => {
  const ips = getLocalIpAddresses();
  console.log(`Server running:`);
  console.log(` - Local:   http://localhost:${port}/`);
  ips.forEach(ip => console.log(` - Network: http://${ip}:${port}/`));
  if (ips.length === 0) {
    console.log('No active network adapter detected. Ensure you are connected to Wi‑Fi/LAN.');
  }
  console.log('If other devices cannot reach it, allow Node.js through the Windows Firewall.');
});
