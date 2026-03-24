const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve built React frontend
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

// Available rooms
const ROOMS = ['General', 'Random', 'Dev'];

// Track clients: Map<ws, { username, room }>
const clients = new Map();

// Track rooms: Map<roomName, Set<ws>>
const rooms = new Map();
ROOMS.forEach(room => rooms.set(room, new Set()));

function broadcast(room, message) {
  const roomClients = rooms.get(room);
  if (!roomClients) return;
  const payload = JSON.stringify(message);
  roomClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastAll(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function getUsersInRoom(room) {
  const roomClients = rooms.get(room);
  if (!roomClients) return [];
  const users = [];
  roomClients.forEach(client => {
    const info = clients.get(client);
    if (info) users.push(info.username);
  });
  return users;
}

function getAllOnlineUsers() {
  const users = new Set();
  clients.forEach(info => users.add(info.username));
  return Array.from(users);
}

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data);
    } catch (e) {
      console.error('Invalid JSON received:', e);
      return;
    }

    const { type, room, username, text, replyTo } = message;

    switch (type) {
      case 'join': {
        // Remove from current room if any
        const current = clients.get(ws);
        if (current && current.room) {
          const oldRoom = rooms.get(current.room);
          if (oldRoom) oldRoom.delete(ws);
          // Notify old room of departure
          broadcast(current.room, {
            type: 'system',
            room: current.room,
            text: `${current.username} left the room`,
            timestamp: new Date().toISOString(),
          });
        }

        // Register client
        clients.set(ws, { username, room });

        // Add to new room
        const targetRoom = rooms.get(room);
        if (targetRoom) {
          targetRoom.add(ws);
        }

        console.log(`${username} joined #${room}`);

        // Send current room history placeholder + online users to the joining client
        ws.send(JSON.stringify({
          type: 'room_joined',
          room,
          users: getUsersInRoom(room),
          allUsers: getAllOnlineUsers(),
        }));

        // Notify room of new member
        broadcast(room, {
          type: 'system',
          room,
          text: `${username} joined the room`,
          timestamp: new Date().toISOString(),
        });

        // Broadcast updated user list to everyone
        broadcastAll({
          type: 'users_update',
          allUsers: getAllOnlineUsers(),
        });

        break;
      }

      case 'message': {
        const info = clients.get(ws);
        if (!info) return;

        const outgoing = {
          type: 'message',
          room: info.room,
          username: info.username,
          text,
          replyTo: replyTo || undefined,
          timestamp: new Date().toISOString(),
        };

        console.log(`[#${info.room}] ${info.username}: ${text}`);
        broadcast(info.room, outgoing);
        break;
      }

      case 'typing': {
        const info = clients.get(ws);
        if (!info) return;
        // Broadcast to everyone in room except sender
        const roomClients = rooms.get(info.room);
        if (roomClients) {
          const payload = JSON.stringify({ type: 'typing', username: info.username, room: info.room });
          roomClients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
        break;
      }

      case 'stop_typing': {
        const info = clients.get(ws);
        if (!info) return;
        const roomClients = rooms.get(info.room);
        if (roomClients) {
          const payload = JSON.stringify({ type: 'stop_typing', username: info.username, room: info.room });
          roomClients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
        break;
      }

      case 'leave': {
        handleLeave(ws);
        break;
      }

      default:
        console.warn('Unknown message type:', type);
    }
  });

  ws.on('close', () => {
    handleLeave(ws);
    console.log('Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    handleLeave(ws);
  });
});

function handleLeave(ws) {
  const info = clients.get(ws);
  if (!info) return;

  const { username, room } = info;

  // Remove from room
  const roomSet = rooms.get(room);
  if (roomSet) roomSet.delete(ws);

  // Remove from clients
  clients.delete(ws);

  // Notify room
  broadcast(room, {
    type: 'system',
    room,
    text: `${username} left the room`,
    timestamp: new Date().toISOString(),
  });

  // Broadcast updated user list
  broadcastAll({
    type: 'users_update',
    allUsers: getAllOnlineUsers(),
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: ROOMS,
    connectedUsers: getAllOnlineUsers(),
  });
});

app.get('/rooms', (req, res) => {
  res.json({ rooms: ROOMS });
});

// Fallback: serve React app for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}`);
});
