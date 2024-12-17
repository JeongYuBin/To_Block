const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    pw: { type: String, required: true },
    nickname: { type: String, required: true },
    createdDate: { type: String, required: true },
    lastAccessDate: { type: String, required: true },
    data: {
      rank: {
        type: Number,
        default: 0,
      },
      rankStats: {
        firstPlace: {
          type: Number,
          default: 0,
        },
        secondPlace: {
          type: Number,
          default: 0,
        },
        thirdPlace: {
          type: Number,
          default: 0,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
