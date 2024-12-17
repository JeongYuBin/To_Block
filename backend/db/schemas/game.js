const mongoose = require("mongoose");
const Room = require("./room"); // Room 스키마 참조


const gameSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      result: {
        type: Object,
        default: {
          1: null,
          2: null,
          3: null,
          4: null,
        },
      },
      date: {
        type: Date,
        default: Date.now,
      },
      user_ids: [
        {
          type: String,
          required: true,
        },
      ],
    },
    {
        timestamps: true, // 생성 및 수정 시간을 자동으로 추가
        versionKey: false, // __v 필드 비활성화
    },
);

// 방의 이름을 기반으로 user_ids를 설정하는 정적 메서드 추가
gameSchema.statics.populateUserIdsFromRoom = async function (roomName) {
    try {
      const room = await Room.findOne({ name: roomName }); // Room에서 이름으로 방 검색
      if (!room) throw new Error("해당 이름의 방을 찾을 수 없습니다.");
  
      // Room의 players에서 id만 추출하여 user_ids에 반환
      return room.players.map((player) => player.id);
    } catch (error) {
      console.error("populateUserIdsFromRoom 에러:", error.message);
      throw error;
    }
  };
  
module.exports = mongoose.model("Game", gameSchema);