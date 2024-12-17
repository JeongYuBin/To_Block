const express = require("express");
const router = express.Router();
const Game = require("../db/schemas/game");

// 예시 데이터 삽입 API
// 예시 데이터를 위해서 만든 페이지 입니다

router.post("/test", async (req, res) => {
    try {
      // 예시 데이터
      const exampleData = [
        {
          name: "game1",
          result: {
            1: "test1",
            2: "test2",
            3: "test3",
            4: "test4",
          },
          date: "2024-11-05T14:22:00Z",
          user_ids: ["test1", "test2", "test3", "test4"],
        },
        {
          name: "game2",
          result: {
            1: "test1",
            2: "test2",
            3: null,
            4: null,
          },
          date: "2024-11-05T14:22:00Z",
          user_ids: ["test1", "test2"],
        },
        {
          name: "game3",
          result: {
            1: "test1",
            2: "test2",
            3: "test3",
            4: null,
          },
          date: "2024-11-05T14:22:00Z",
          user_ids: ["test1", "test2", "test3"],
        },
      ];
  
      // 데이터를 Game 컬렉션에 삽입
      const insertedGames = await Game.insertMany(exampleData);
  
      res.status(201).json({
        message: "테스트 데이터가 성공적으로 삽입되었습니다.",
        data: insertedGames,
      });
    } catch (error) {
      console.error("테스트 데이터 삽입 오류:", error.message);
      res.status(500).json({
        message: "테스트 데이터 삽입 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  });

  router.post("/record", async (req, res) => {
    try {
        const { user_id } = req.body;
        console.log("Searching for user_id:", user_id);

        if (!user_id) {
            return res.status(400).json({
                message: "user_id를 입력해주세요.",
            });
        }

        // 쿼리 확인을 위한 로그
        const query = {
            $or: [
                { "result.1": user_id },
                { "result.2": user_id },
                { "result.3": user_id }
            ],
        };
        console.log("Query:", JSON.stringify(query));

        const games = await Game.find(query);
        console.log("Found games:", games);

        if (games.length === 0) {
            return res.status(404).json({
                message: "해당 user_id가 포함된 게임이 없습니다.",
            });
        }

        res.status(200).json({
            code: 200,
            message: "유저의 게임정보를 조회했습니다.",
            data: {
                games: games.map((game) => ({
                    game_name: game.name,
                    date: game.date,
                    result: game.result,
                })),
            },
        });
    } catch (error) {
        console.error("게임 정보 조회 오류:", error.message);
        res.status(500).json({
            message: "게임 정보 조회 중 오류가 발생했습니다.",
            error: error.message,
        });
    }
  });
  

module.exports = router;
