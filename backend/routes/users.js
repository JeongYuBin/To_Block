var express = require("express");
var router = express.Router();
const User = require("../db/schemas/user");
const Game = require("../db/schemas/game");
const Room = require("../db/schemas/room");
const { generateToken } = require("../controllers/auth");
const jwt = require("jsonwebtoken");

// 회원가입
router.post("/signup", async (req, res) => {
  try {
    const { id, pw, nickname } = req.body;

    // 이미 존재하는 ID인지 확인
    const existingUser = await User.findById(id);
    if (existingUser) {
      return res.status(400).json({ message: "이미 존재하는 ID입니다." });
    }

    // 새 사용자 생성
    const newUser = await User.create({
      _id: id,
      pw: pw, // 실제로는 비밀번호 암호화 필요
      nickname: nickname,
      createdDate: new Date().toISOString(),
      lastAccessDate: new Date().toISOString(),
    });
    console.log("it's ok now");
    const token = generateToken({ id: newUser.id });
    console.log("it's not ok");
    res.status(200).json({
      code: 200,
      message: "회원가입을 완료했습니다.",
      data: {
        userId: newUser._id,
        accessToken: token,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "서버 에러",
      error: error.message,
    });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  try {
    const { id, pw } = req.body;

    // 요청 데이터 확인
    if (!id || !pw) {
      return res
        .status(400)
        .json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    // 사용자 찾기
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 비밀번호 확인
    if (user.pw !== pw) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // 마지막 접속 시간 업데이트
    user.lastAccessDate = new Date().toISOString();
    await user.save();

    // 토큰 생성
    const token = generateToken({ id: user._id });

    res.status(200).json({
      message: "로그인 성공",
      user: { id: user._id, nickname: user.nickname },
      accessToken: token, // 클라이언트로 토큰 전달
    });
  } catch (error) {
    res.status(500).json({
      message: "서버 에러",
      error: error.message,
    });
  }
});

//  // 로그아웃
// router.post('/logout', (req, res) => {
// 	try {
// 		// 세션 제거
// 		req.session.destroy((err) => {
// 			if (err) {
// 				return res.status(500).json({ message: "로그아웃 실패" });
// 			}
// 			res.status(200).json({ message: "로그아웃 성공" });
// 		});

// 	} catch (error) {
// 		res.status(500).json({
// 			message: "서버 에러",
// 			error: error.message
// 		});
// 	}
//  });
router.post("/record", async (req, res) => {
  try {
    const { user_id } = req.body;
    console.log("Searching for user_id:", user_id);

    const games = await Game.find({
      $or: [
        { "result.1": user_id },
        { "result.2": user_id },
        { "result.3": user_id },
      ],
    }).sort({ date: -1 });

    console.log("Found games:", games); // 찾은 게임 정보 로그
    console.log("Sending response..."); // 응답 전송 시작 로그

    if (games.length === 0) {
      return res.status(404).json({
        message: "해당 user_id가 포함된 게임이 없습니다.",
      });
    }

    const response = {
      code: 200,
      message: "유저의 게임정보를 조회했습니다.",
      data: {
        games: games.map((game) => ({
          game_name: game.name,
          date: game.date,
          result: game.result,
        })),
      },
    };
    console.log("Response data:", response); // 실제 전송되는 데이터 로그
    res.status(200).json(response);
  } catch (error) {
    console.error("게임 정보 조회 오류:", error);
    res.status(500).json({
      message: "게임 정보 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 라우터에 새로운 엔드포인트 추가
router.post("/latest-game", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id를 입력해주세요.",
      });
    }

    // 해당 유저가 참여한 가장 최근 게임 찾기
    const latestGame = await Game.findOne({
      user_ids: user_id,
    }).sort({ date: -1 }); // 최신순 정렬

    if (!latestGame) {
      return res.status(404).json({
        message: "게임 기록이 없습니다.",
      });
    }

    res.status(200).json({
      code: 200,
      message: "최근 게임 정보를 조회했습니다.",
      data: {
        game_name: latestGame.name,
        date: latestGame.date,
        result: latestGame.result,
        user_ids: latestGame.user_ids,
      },
    });
  } catch (error) {
    console.error("게임 정보 조회 오류:", error);
    res.status(500).json({
      message: "게임 정보 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 전체 유저 조회
router.get("/users", async (req, res) => {
  try {
    // 유저 데이터 조회 및 정렬
    const users = await User.find({}, { _id: 1, lastAccessDate: 1 }) // 필요한 필드만 가져옴
      .sort({ lastAccessDate: -1 }); // lastAccessDate 내림차순 정렬

    // 유저 데이터가 없을 경우 처리
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "조회할 유저가 없습니다." });
    }

    // 응답 전송
    res.status(200).json({
      code: 200,
      message: "전체 유저 정보를 조회했습니다.",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: "서버 에러",
      error: error.message,
    });
  }
});

module.exports = router;
