// socket/index.js
const socketIO = require("socket.io");
const { roomEvents } = require("./events/roomEvents");
const { gameEvents } = require("./events/gameEvents");

let io;

// Socket.IO 초기화 함수
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin:
        "http://localhost:20380, https://team03.kwweb.duckdns.org, http://team03.kwweb.duckdns.org:20380",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

    // 룸 이벤트 핸들러 연결
    roomEvents(io, socket);
    gameEvents(io, socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  return io;
};

// Socket.IO 인스턴스 가져오기
const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
