// socket/events/roomEvents.js
const Room = require("../../db/schemas/room");
const Game = require("../../db/schemas/game");
const mongoose = require("mongoose");
const gameDataByRoom = {};
const roundRankingsByRoom = {};
const gameEndRequestsByRoom = {};
const gameIdByRoom = {};

const clearRoomData = (roomId) => {
	const roomDataKeys = [
		roundRankingsByRoom,
		gameDataByRoom,
		gameEndRequestsByRoom,
		gameIdByRoom
	];
 
	roomDataKeys.forEach(storage => {
		delete storage[roomId];
	});
 
	console.log(`Cleared all data for room: ${roomId}`);
 };

const getRoomData = async (roomId, userId) => {
  const room = await Room.findOne({ _id: roomId });

  if (!room) {
    return {
      isOwner: false,
      players: [],
      room: null
    };
  }

  const isOwner = room.players.find(player => player.id === userId)?.isOwner || false;

  return {
    isOwner,
    players: room.players,
    room
  };
};

const calculateFinalRanking = (roundRankings = {}, playerSet) => {
  console.log("Calculating final ranking with:", { roundRankings, playerSet });
  
  // 초기 점수 설정
  const playerScores = {};
  playerSet.forEach(playerId => {
    playerScores[playerId] = 0;
  });

  // 각 라운드별 점수 계산
  [1, 2, 3].forEach(round => {
    // roundRankings나 해당 라운드 데이터가 없으면 건너뛰기
    if (!roundRankings || !roundRankings[round]) {
      return;
    }

    const roundRanking = roundRankings[round];
    if (Array.isArray(roundRanking)) {
      roundRanking.forEach((playerId, index) => {
        if (playerSet.has(playerId)) {
          if (playerSet.size === 2) {
            switch(index) {
              case 0: playerScores[playerId] += 5; break;
              case 1: playerScores[playerId] += 3; break;
            }
          } else {
            switch(index) {
              case 0: playerScores[playerId] += 5; break;
              case 1: playerScores[playerId] += 3; break;
              case 2: playerScores[playerId] += 1; break;
            }
          }
        }
      });
    }
  });

  console.log("Calculated scores:", playerScores);

  // 점수가 0이더라도 모든 플레이어의 랭킹 계산
  const sortedPlayers = Object.entries(playerScores)
    .map(([playerId, score]) => ({ playerId, score }))
    .sort((a, b) => b.score - a.score);

  let currentRank = 1;
  let currentScore = sortedPlayers[0]?.score;
  let sameRankCount = 0;

  const finalRanking = sortedPlayers.map((player, index) => {
    if (player.score === currentScore) {
      sameRankCount++;
    } else {
      currentRank += sameRankCount;
      currentScore = player.score;
      sameRankCount = 1;
    }
    return {
      ...player,
      rank: currentRank
    };
  });

  console.log("Final ranking:", finalRanking);
  return finalRanking;
};

const calculateProgress = (current, solution) => {
    let correctCount = 0;
    let totalRequired = 0;
    // 3차원 배열을 순회하면서 비교
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          // 정답에서 1인 위치 카운트
          if (solution[y][x][z] === 1) {
            totalRequired++;
            // 현재 상태도 1이면 정확히 놓은 것
            if (current[y][x][z] === 1) {
              correctCount++;
            }
          }
          // 정답은 0인데 현재 상태가 1이면 잘못 놓은 것
          else if (current[y][x][z] === 1) {
            correctCount--; // 페널티 부여
          }
        }
      }
    }
    // 진행률 계산 (최소 0%, 최대 100%)
    const progress = Math.max(0, Math.min(100, (correctCount / totalRequired) * 100));
    return Math.round(progress);
};
  


// socket/events/gameEvents.js
const gameEvents = (io, socket) => {
  // 게임룸 참가 이벤트
  socket.on("joinGameRoom", async ({ roomId, userId }) => {
    socket.join(`game-${roomId}`);
    console.log(`Player ${userId} joined game room: ${roomId}`);
		const { isOwner, players, room } = await getRoomData(roomId, userId);
		console.log('Is user owner?:', isOwner);

		if (isOwner) {
			gameDataByRoom[roomId] = await mongoose.connection.db
				.collection("data")
				.aggregate([{ $sample: { size: 3 } }])
				.toArray();
			console.log("****1***", gameDataByRoom[roomId][0].cube.data);
			console.log("", gameDataByRoom[roomId][0].projections);
			console.log("****2***", gameDataByRoom[roomId][1].cube.data);
			console.log("", gameDataByRoom[roomId][1].projections);
			console.log("****3***", gameDataByRoom[roomId][2].cube.data);
			console.log("", gameDataByRoom[roomId][2].projections);
			console.log();
			io.to(`game-${roomId}`).emit("gameData", {
				round1: gameDataByRoom[roomId][0].projections,
				round2: gameDataByRoom[roomId][1].projections,
				round3: gameDataByRoom[roomId][2].projections,
			});
			io.to(`game-${roomId}`).emit('roomPlayers', players);

			try{
				const game = new Game({
					name: room.name,
					user_ids: room.players.map((player) => player.id),
					maxPlayers: room.maxPlayers,
					mode: room.mode,
				});
				await game.save();
				console.log(`게임 문서 생성 완료: ${game._id}`);
				gameIdByRoom[roomId] = game._id;
			} catch (error) {
				console.error("Db에 game 생성중 오류");
			}
		}
  });


	// 큐브 매트릭스 업데이트 이벤트
	socket.on('updateCubeMatrix', ({ roomId, userId, currentRound, matrix }) => {
	  console.log(`Matrix update from ${userId}:`, matrix);
		progress = calculateProgress(matrix, gameDataByRoom[roomId][currentRound-1].cube.data);
		console.log('progress:', progress);
		// 100% 달성 시 순위 기록
		if (progress === 100) {
			// 해당 방의 현재 라운드 순위 초기화
			if (!roundRankingsByRoom[roomId]) {
				roundRankingsByRoom[roomId] = {};
			}
			if (!roundRankingsByRoom[roomId][currentRound]) {
				roundRankingsByRoom[roomId][currentRound] = [];
			}

			// 아직 순위에 없는 경우에만 추가
			if (!roundRankingsByRoom[roomId][currentRound].includes(userId)) {
				roundRankingsByRoom[roomId][currentRound].push(userId);
				console.log(`Round ${currentRound} rankings for room ${roomId}:`, roundRankingsByRoom[roomId][currentRound]);
			}
		}

	  io.to(`game-${roomId}`).emit('progressUpdated', {
			userId,
			progress
	  });
	});
  
	socket.on('leaveGameRoom', async ({ roomId, roomName, userId, opt}) => {
		console.log("I'm out");
		console.log(`Client left waiting room: roomName=${roomName}, userId=${userId}`, socket.id);
	  
		socket.leave(`waiting-${roomId}`);
		socket.leave(`game-${roomId}`);
		const waitingRoom = io.sockets.adapter.rooms.get(`waiting-${roomId}`);
		const gameRoom = io.sockets.adapter.rooms.get(`game-${roomId}`);
		
		console.log(`Waiting room ${roomId} 남은 인원: ${waitingRoom ? waitingRoom.size : 0}`);
		console.log(`Game room ${roomId} 남은 인원: ${gameRoom ? gameRoom.size : 0}`);
	  
		try {
			const room = await Room.findOne({ name: roomName });
		  if (!room) {
			console.log('방을 찾을 수 없습니다.');
			return;
		  }
			if ( opt === 1)
			{
				await room.deleteOne(); 
				console.log(`게임 방 (${roomName}) 삭제됨`);
			}
			else
			{
				const game = await Game.findOne({ name: roomName });
				if (!game) {
				console.log('게임 기록을 찾을 수 없습니다.');
				return;
				}
				console.log(`게임 문서 찾음: ${JSON.stringify(game)}`);
			
				// user_ids 배열에서 userId 제거
				game.user_ids = game.user_ids.filter((id) => id !== userId);
				// 사용자가 나갔고, user_ids 배열이 비면 게임 문서 삭제
				if (game.user_ids.length === 0) {
					await game.deleteOne();
					console.log(`게임 기록 (${roomName}) 삭제됨`);
					await room.deleteOne(); 
					console.log(`게임 방 (${roomName}) 삭제됨`);
					clearRoomData(roomId);
				}
				else {
						await game.save();  // 배열이 비지 않으면 저장
				}
			}
		} catch (error) {
		  console.error('socket on leaveGameRoom 오류발생', error);
		}
	});

socket.on('gameEnd', async ({ roomName, roomId, userId }) => {
 try {
  	const gameRoom = io.sockets.adapter.rooms.get(`game-${roomId}`);
  	const players = gameRoom ? Array.from(gameRoom) : [];
  	console.log("num of players", players.length);

   // 해당 방의 게임 종료 요청 카운트 초기화 및 증가
   if (!gameEndRequestsByRoom[roomId]) {
     gameEndRequestsByRoom[roomId] = new Set();
   }
   gameEndRequestsByRoom[roomId].add(userId);

   // 모든 플레이어가 게임 종료 요청을 보냈는지 확인
   if (gameEndRequestsByRoom[roomId].size === players.length) {
			const gameId = gameIdByRoom[roomId];  // 저장해둔 ID로 게임 찾기
			const game = await Game.findById(gameId);
			if (game) {
				const finalRanking = calculateFinalRanking(roundRankingsByRoom[roomId], gameEndRequestsByRoom[roomId]);
				
				// 순위별로 플레이어 ID를 그룹화
				const rankGroups = {};
				finalRanking.forEach(({ playerId, rank }) => {
					if (!rankGroups[rank]) {
						rankGroups[rank] = [];
					}
					rankGroups[rank].push(playerId);
				});
			
				// 게임 결과 업데이트
				game.result = {
					1: rankGroups[1] || null,    // 1등
					2: rankGroups[2] || null,    // 2등
					3: rankGroups[3] || null,    // 3등
					4: null                      // 사용하지 않음
				};
			
				await game.save();
				console.log('Final game results saved for room:', roomId);
				// DB 저장이 성공한 후에 클라이언트에 결과 전송
				io.to(`game-${roomId}`).emit('toResult', {
					roomId: roomId, 
					roomName: roomName, 
					userId: userId,
				});
				clearRoomData(roomId);
			}
   	}
 	} catch (error) {
   console.error('Error saving game end results:', error);
 	}
	});
};

module.exports = { gameEvents };
