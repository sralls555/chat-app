import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = (() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}`;
})();

export function useWebSocket({ username, currentRoom, onMessage }) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!username) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        setError(null);
        console.log('WebSocket connected');
        // Auto-join current room on connect/reconnect
        if (currentRoom) {
          ws.send(JSON.stringify({ type: 'join', username, room: currentRoom }));
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          onMessage(msg);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        console.log('WebSocket disconnected, reconnecting in 3s...');
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 3000);
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setError('Connection error. Retrying...');
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setError('Failed to connect');
    }
  }, [username, currentRoom, onMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  const joinRoom = useCallback((room) => {
    sendMessage({ type: 'join', username, room });
  }, [sendMessage, username]);

  const sendTyping = useCallback(() => {
    sendMessage({ type: 'typing' });
  }, [sendMessage]);

  const sendStopTyping = useCallback(() => {
    sendMessage({ type: 'stop_typing' });
  }, [sendMessage]);

  return { connected, error, sendMessage, joinRoom, sendTyping, sendStopTyping };
}
