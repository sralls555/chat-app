import { useState, useCallback, useRef } from 'react';
import UsernameModal from './components/UsernameModal.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import MessageInput from './components/MessageInput.jsx';
import OnlineUsers from './components/OnlineUsers.jsx';
import TypingIndicator from './components/TypingIndicator.jsx';
import { useWebSocket } from './hooks/useWebSocket.js';
import styles from './App.module.css';

const DEFAULT_ROOM = 'General';

export default function App() {
  const [username, setUsername] = useState('');
  const [currentRoom, setCurrentRoom] = useState(DEFAULT_ROOM);
  const [roomMessages, setRoomMessages] = useState({ General: [], Random: [], Dev: [] });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const pendingRoomRef = useRef(null);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'message':
      case 'system':
        setRoomMessages((prev) => {
          const room = msg.room;
          const existing = prev[room] || [];
          return { ...prev, [room]: [...existing, { ...msg, id: `${Date.now()}-${Math.random()}` }] };
        });
        // Remove from typing when they send a message
        if (msg.type === 'message') {
          setTypingUsers(prev => prev.filter(u => u !== msg.username));
        }
        break;

      case 'room_joined':
        setOnlineUsers(msg.allUsers || []);
        setTypingUsers([]); // clear on room change
        if (pendingRoomRef.current === msg.room) {
          setCurrentRoom(msg.room);
          pendingRoomRef.current = null;
        }
        break;

      case 'users_update':
        setOnlineUsers(msg.allUsers || []);
        break;

      case 'typing':
        if (msg.room === currentRoom) {
          setTypingUsers(prev =>
            prev.includes(msg.username) ? prev : [...prev, msg.username]
          );
        }
        break;

      case 'stop_typing':
        setTypingUsers(prev => prev.filter(u => u !== msg.username));
        break;

      default:
        break;
    }
  }, [currentRoom]);

  const { connected, error, sendMessage, joinRoom, sendTyping, sendStopTyping } = useWebSocket({
    username,
    currentRoom,
    onMessage: handleMessage,
  });

  const handleUsernameSubmit = (name) => setUsername(name);

  const handleRoomChange = useCallback((room) => {
    if (room === currentRoom) return;
    pendingRoomRef.current = room;
    joinRoom(room);
    setCurrentRoom(room);
    setSidebarOpen(false);
    setTypingUsers([]);
  }, [currentRoom, joinRoom]);

  const handleSend = useCallback((text, reply) => {
    sendMessage({
      type: 'message',
      text,
      replyTo: reply ? { username: reply.username, text: reply.text } : undefined,
    });
  }, [sendMessage]);

  const handleReply = useCallback((message) => setReplyTo(message), []);

  const currentMessages = roomMessages[currentRoom] || [];

  if (!username) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />;
  }

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        currentRoom={currentRoom}
        onRoomChange={handleRoomChange}
        username={username}
        connected={connected}
        isOpen={sidebarOpen}
      />

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle menu"
            >☰</button>
            <span className={styles.headerHash}>#</span>
            <span className={styles.headerRoom}>{currentRoom.toLowerCase()}</span>
          </div>
          <div className={styles.headerRight}>
            {error && <span className={styles.errorBadge}>{error}</span>}
            {!connected && !error && <span className={styles.connectingBadge}>Connecting...</span>}
          </div>
        </header>

        <ChatArea
          messages={currentMessages}
          username={username}
          currentRoom={currentRoom}
          onReply={handleReply}
        />

        <TypingIndicator typingUsers={typingUsers} />

        <MessageInput
          onSend={handleSend}
          currentRoom={currentRoom}
          disabled={!connected}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTyping={sendTyping}
          onStopTyping={sendStopTyping}
        />
      </div>

      <OnlineUsers users={onlineUsers} currentRoom={currentRoom} />
    </div>
  );
}
