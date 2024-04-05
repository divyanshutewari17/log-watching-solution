// App.js

import React, { useEffect, useState } from 'react';
import './App.css';

const App = () => {
  const [logData, setLogData] = useState([]);
  const addLog = async () => {
    const date = new Date()
    const newData = `Log added at ${date}`;
    try {
      await fetch('http://localhost:8080/append-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: newData })
      });
    } catch (error) {
      console.error('Error appending log data:', error);
    }
  };

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('Connected to server');
    };

    socket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type === 'initial') {
        setLogData(data);
      } else if (type === 'update') {
        setLogData(prevData => [...prevData, ...data]);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(addLog, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h1>Log Watching Solution</h1>
      <div className="log-container">
        <p> ---- logging started ---- </p>
        <br/>
        {logData.map((line, index) => (
          <p key={index}>$ {line}</p>
        ))}
      </div>
    </div>
  );
};

export default App;
