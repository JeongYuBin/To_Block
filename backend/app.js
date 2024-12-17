var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");
var app = express();

// CORS 설정 추가
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "http://localhost:20380, https://team03.kwweb.duckdns.org, http://team03.kwweb.duckdns.org:20380"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// DB 연결을 가장 먼저 실행
const connectDB = require("./db/index.js");

// mongoose 디버그 모드 활성화
mongoose.set("debug", true);

// mongoose 연결 이벤트 리스너 추가
mongoose.connection.on("connected", () => {
  console.log("Mongoose가 MongoDB에 연결되었습니다.");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose 연결 에러:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose 연결이 끊어졌습니다.");
});

// DB 연결 시도
connectDB()
  .then(() => {
    console.log("DB 연결 후 서버 설정 시작");
  })
  .catch((err) => {
    console.error("DB 연결 실패:", err);
  });

require("dotenv").config();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var modeRouter = require("./routes/mode");
var roomRouter = require("./routes/rooms");
var gameRoutes = require("./routes/games");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/mode", modeRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/games", gameRoutes);

module.exports = app;
