// // backend/routes/mode.js
// const express = require('express');
// const router = express.Router();

// router.post('/select', (req, res) => {
//   const { mode } = req.body;

//   // mode 값에 따라 canCreateOrJoinRoom 값을 설정
//   if (mode === 'solo-mode' || mode === 'multi-mode') {
//     response.canCreateOrJoinRoom = true;
//   }

//   res.json({
//     code: 200,
//     message: "모드 선택을 완료했습니다.",
//     mode,
//     canCreateOrJoinRoom: mode === 'multi-mode', // multi-mode만 방 생성 가능
//   });
// });

// module.exports = router;

// backend/routes/mode.js
const express = require('express');
const router = express.Router();

router.post('/select', (req, res) => {
  try {
    const { mode } = req.body;

    if (!mode) {
      return res.status(400).json({ code: 400, message: "모드를 제공해야 합니다." });
    }

    // mode 값에 따라 canCreateOrJoinRoom 값을 설정
    const canCreateOrJoinRoom = mode === 'multi-mode';

    if (mode !== 'solo-mode' && mode !== 'multi-mode') {
      return res.status(400).json({
        code: 400,
        message: "올바르지 않은 모드입니다. 'solo-mode' 또는 'multi-mode'를 선택하세요.",
      });
    }

    res.json({
      code: 200,
      message: "모드 선택을 완료했습니다.",
      mode,
      canCreateOrJoinRoom,
    });
  } catch (err) {
    console.error("모드 선택 중 오류:", err.message);

    res.status(500).json({
      code: 500,
      message: "모드 선택 중 오류가 발생했습니다.",
      error: err.message,
    });
  }
});

module.exports = router;
