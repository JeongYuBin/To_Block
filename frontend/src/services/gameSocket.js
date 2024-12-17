import { io } from 'socket.io-client';

const gameSocket = io('/', {
  path: '/socket.io',
});

// 연결 상태 로깅
gameSocket.on('connect', () => {
  console.log('Game socket connected');
});

gameSocket.on('disconnect', () => {
  console.log('Game socket disconnected');
});

gameSocket.on('connect_error', (error) => {
  console.error('Game socket connection error:', error);
});

export default gameSocket;