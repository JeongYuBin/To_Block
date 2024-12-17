// socket/events/roomEvents.js
const Room = require('../../db/schemas/room');

// 소켓 이벤트 핸들러들
const roomEvents = (io, socket) => {
  // 로비 입장
  socket.on('joinLobby', () => {
    socket.join('lobby');
    console.log('Client joined lobby:', socket.id);
  });

  // 대기실 입장
  socket.on('joinWaitingRoom', (roomId) => {
    socket.join(`waiting-${roomId}`);
    console.log(`Client joined waiting room: ${roomId}`, socket.id);
  });

  // 대기실 퇴장
  socket.on('leaveWaitingRoom', (roomId) => {
	
    socket.leave(`waiting-${roomId}`);
    console.log(`Client left waiting room: ${roomId}`, socket.id);
  });

  // 채팅 메시지 수신 및 브로드캐스트
  socket.on('sendMessage', ({ roomId, userId, message }) => {
    console.log('Message received:', { roomId, userId, message });
    
    const messageData = {
      userId,
      message,
      // timestamp: new Date()
    };

    // 해당 대기실의 모든 사용자에게 메시지 전달
    io.to(`waiting-${roomId}`).emit('receiveMessage', messageData);
  });

  socket.on('gameStart', async (roomId) => {
    try {
      // Room DB의 mode를 'playing'으로 업데이트
      await Room.findByIdAndUpdate(roomId, { mode: 'playing' });
      
      // 해당 대기실의 모든 사용자에게 게임 시작을 알림
      io.to(`waiting-${roomId}`).emit('gameStarted', roomId);
      
      // 방 정보가 변경되었으므로 업데이트 브로드캐스트
      await broadcastRoomUpdate(io, roomId);
    } catch (error) {
      console.error('게임 시작 처리 중 오류:', error);
      socket.emit('error', '게임을 시작하는 중 오류가 발생했습니다.');
    }
  });

};

// 방 정보 업데이트 브로드캐스트
const broadcastRoomUpdate = async (io, roomId) => {
  try {
    const updatedRoom = await Room.findById(roomId);
    if (updatedRoom) {
      // 로비에 있는 모든 클라이언트에게 방 정보 업데이트 전송
      io.to('lobby').emit('roomUpdate', {
        roomid: updatedRoom._id,
        name: updatedRoom.name,
        mode: updatedRoom.mode,
        players: updatedRoom.players,
        maxPlayers: updatedRoom.maxPlayers
      });

      // 해당 대기실에 있는 클라이언트들에게 상세 정보 전송
      io.to(`waiting-${roomId}`).emit('waitingRoomUpdate', {
        roomid: updatedRoom._id,
        name: updatedRoom.name,
        players: updatedRoom.players,
        maxPlayers: updatedRoom.maxPlayers
      });
    }
  } catch (error) {
    console.error('방 정보 업데이트 브로드캐스트 중 오류:', error);
  }
};

// 방 삭제 브로드캐스트
const broadcastRoomDelete = (io, roomId) => {
  io.to('lobby').emit('roomDelete', roomId);
  io.to(`waiting-${roomId}`).emit('roomDelete', roomId);
};

module.exports = {
  roomEvents,
  broadcastRoomUpdate,
  broadcastRoomDelete
};
