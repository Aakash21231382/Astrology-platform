import { io } from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:5000';

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('astrology_token');
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  const token = localStorage.getItem('astrology_token');
  if (s) {
    s.auth = { token };
    if (!s.connected) {
      s.connect();
    }
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
