const express = require('express');
const router = express.Router();
const Room = require("../db/schemas/room");
const { getIO } = require('../socket/index');
const { broadcastRoomUpdate, broadcastRoomDelete } = require('../socket/events/roomEvents');

router.post('/create', async (req, res) => {
	const { roomName, mode, userId } = req.body;
  
	if (!roomName || !mode || (mode !== 'solo-mode' && mode !== 'multi-mode')) {
	  return res.status(400).json({
		code: 400,
		message: "잘못된 요청입니다. 방 이름과 모드를 확인하세요.",
	  });
	}
  
	try {
	  const existingRoom = await Room.findOne({ name: roomName });
	  if (existingRoom) {
		return res.status(400).json({
		  code: 400,
		  message: "중복된 방 이름입니다. 다른 이름으로 시도하세요.",
		});
	  }
	  
	  const maxPlayers = mode === 'multi-mode' ? 4 : 1;
	  
	  const room = new Room({
		name: roomName,
		mode,
		players: [{ id: userId, status: 'joined', isOwner: true }], // 방 생성자를 방장으로 설정
		maxPlayers,
	  });
  
	  await room.save();
  
	  // Socket.IO로 새로운 방 생성 알림
	  const io = getIO();
	  broadcastRoomUpdate(io, room._id);
  
	  res.json({
		code: 200,
		message: "방 생성을 완료했습니다.",
		room: {
		  roomid: room._id,
		  name: room.name,
		  mode: room.mode,
		  players: room.players,
		  maxPlayers: room.maxPlayers,
		},
	  });
	} catch (err) {
	  res.status(500).json({ code: 500, message: "방 생성 중 오류 발생", error: err.message });
	}
});
  

router.get('/list', async (req, res) => {
    try {
        const rooms = await Room.find();
    
        res.json({
          code: 200,
          rooms: rooms.map(room => ({
            roomid: room._id,
            name: room.name,
            mode: room.mode,
            players: room.players,
            maxPlayers: room.maxPlayers,
            currentPlayers: room.players.length,
          })),
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: "방 목록 조회 중 오류 발생", error: err.message });
    }
});

router.post('/join', async (req, res) => {
  const { roomName, userId } = req.body;
  try {
    const room = await Room.findOne({ name: roomName }); 

    if (!room) {
      return res.status(404).json({ code: 404, message: "해당 이름의 방을 찾을 수 없습니다." });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ code: 400, message: "방이 가득 찼습니다." });
    }

    // 이미 참가한 플레이어인지 확인
    const existingPlayer = room.players.find(player => player.id === userId);
    if (existingPlayer) {
      return res.status(400).json({ code: 400, message: "이미 참가한 플레이어입니다." });
    }

    const newPlayer = { 
      id: userId, 
      status: 'joined' 
    };  
    room.players.push(newPlayer);

    await room.save();

    // Socket.IO로 방 정보 업데이트 알림
    const io = getIO();
    broadcastRoomUpdate(io, room._id);

    res.json({
      code: 200,
      message: "방 참가를 완료했습니다.",
      room: {
        roomid: room._id,
        name: room.name,
        mode: room.mode,
        players: room.players,
        maxPlayers: room.maxPlayers,
      },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: "방 참가 중 오류 발생", error: err.message });
  }
});

router.get('/:roomId/waiting', async (req, res) => {
  const roomId = req.params.roomId;

  try {
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "해당 ID의 방을 찾을 수 없습니다.",
      });
    }

    res.json({
      code: 200,
      room: {
        id: room._id,
        name: room.name,
        players: room.players,
        maxPlayers: room.maxPlayers,
        currentPlayers: room.players.length,
      },
      message: "Waiting for other players to join.",
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      message: "대기 화면 조회 중 오류 발생",
      error: err.message,
    });
  }
});

router.delete('/:roomId/leave', async (req, res) => {
	const { userId } = req.body;
	const roomId = req.params.roomId;
   
	if (!userId) {
	  return res.status(400).json({
		code: 400,
		message: "사용자 ID가 제공되지 않았습니다.",
	  });
	}
   
	try {
	  const room = await Room.findById(roomId);
	  if (!room) {
		return res.status(404).json({
		  code: 404,
		  message: "해당 ID의 방을 찾을 수 없습니다.",
		});
	  }
   
	  const playerIndex = room.players.findIndex(player => player.id === userId);
	  if (playerIndex === -1) {
		return res.status(404).json({
		  code: 404,
		  message: "사용자가 방에 존재하지 않습니다.",
		});
	  }
   
	  // 방장인지 확인
	  const isOwner = room.players[playerIndex].isOwner;
   
	  room.players.splice(playerIndex, 1);
	  const io = getIO();
   
	  if (room.players.length === 0) {
		await Room.findByIdAndDelete(roomId);
		broadcastRoomDelete(io, roomId);
		
		return res.json({
		  code: 200,
		  message: "모든 사용자가 방을 나가 방이 삭제되었습니다.",
		  roomId,
		});
	  } else {
		// 방장이 나갔다면 다음 사람에게 방장 권한 이전
		if (isOwner && room.players.length > 0) {
		  room.players[0].isOwner = true;
		}
   
		await room.save();
		broadcastRoomUpdate(io, roomId);
		
		return res.json({
		  code: 200,
		  message: "사용자가 방을 나갔습니다.",
		  roomId: room._id,
		  remainingPlayers: room.players,
		});
	  }
	} catch (err) {
	  if (err.name === 'CastError') {
		return res.status(400).json({
		  code: 400,
		  message: "유효하지 않은 방 ID 형식입니다.",
		  error: err.message,
		});
	  }
   
	  res.status(500).json({
		code: 500,
		message: "사용자 나가기 중 오류 발생",
		error: err.message,
	  });
	}
});

// 팀 변경 엔드포인트 추가
router.post('/:roomId/team', async (req, res) => {
  const { userId, team } = req.body;
  const roomId = req.params.roomId;

  if (!userId || !team) {
    return res.status(400).json({
      code: 400,
      message: "사용자 ID와 팀 정보가 필요합니다.",
    });
  }

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "해당 ID의 방을 찾을 수 없습니다.",
      });
    }

    const player = room.players.find(p => p.id === userId);
    if (!player) {
      return res.status(404).json({
        code: 404,
        message: "사용자가 방에 존재하지 않습니다.",
      });
    }

    // 팀 변경
    player.team = team;
    await room.save();

    // Socket.IO로 방 정보 업데이트 알림
    const io = getIO();
    broadcastRoomUpdate(io, roomId);

    res.json({
      code: 200,
      message: "팀 변경이 완료되었습니다.",
      room: {
        roomid: room._id,
        players: room.players,
      },
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      message: "팀 변경 중 오류 발생",
      error: err.message,
    });
  }
});

module.exports = router;