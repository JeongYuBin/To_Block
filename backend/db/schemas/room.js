const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true },
	mode: { type: String, enum: ['solo-mode', 'multi-mode'], required: true },
	players: {
	  type: [
		{
		  id: { type: String, required: true },
		  status: { type: String, default: 'joined' },
		  isOwner: { type: Boolean, default: false }
		},
	  ],
	  default: [],
	  _id: false,
	},
	maxPlayers: { type: Number, required: true },
  }, 
  { versionKey: false }
);

module.exports = mongoose.model("Room", roomSchema);