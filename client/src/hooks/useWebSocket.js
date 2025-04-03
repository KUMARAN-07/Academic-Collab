import { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../stores/authStore';

export const useWebSocket = () => {
  const [ws, setWs] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = useCallback(() => {
    if (!useAuthStore.getState().token) {
      setWs(null);
      return;
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    // Create WebSocket connection with auth token
    const socket = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws'}?token=${useAuthStore.getState().token}`);

    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setWs(socket);
    });

    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setWs(null);
      setReconnectAttempts(prev => prev + 1);
      // Attempt to reconnect with exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connectWebSocket, backoffDelay);
    });

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setWs(null);
    });

    return socket;
  }, []);

  useEffect(() => {
    setReconnectAttempts(0);
    const socket = connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return ws;
};