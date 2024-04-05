// server.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express();
app.use(cors())
app.use(bodyParser.json())

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const filePath = 'file.log';
let lastIndex = 0

// Function to read last 10 lines from the log file
const readLastLines = () => {
  const data = fs.readFileSync(filePath, 'utf8').split('\n');
  lastIndex = data.length - 1;
  return data.slice(Math.max(data.length - 10, 0)).join('\n').split("\r\n");
};

let timeout;

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send last 10 lines to the client upon connection
  ws.send(JSON.stringify({ type: 'initial', data: readLastLines() }));

  // Watch for changes in the log file and send updates to the client
  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      clearTimeout(timeout); // Clear any existing timeout
  
      timeout = setTimeout(() => {
        const updatedData = fs.readFileSync(filePath, 'utf8');
        const lines = updatedData.split('\n').slice(lastIndex+1);
        lastIndex = updatedData.split('\n').length-1
        
        ws.send(JSON.stringify({ type: 'update', data: lines.join('\n').split("\r\n") }));
      }, 1000); // Adjust the delay as needed (e.g., 500ms)
    }
  });

  // Handle WebSocket close event
  ws.on('close', () => {
    console.log('Client disconnected');
    watcher.close();
  });
});

app.post('/append-log', (req, res) => {
    const { data } = req.body;
    fs.appendFileSync(filePath, `\r\n${data}`);
    res.status(200).send('Log data appended successfully');
  });

server.listen(8080, () => {
  console.log('Server listening on port 8080');
});
