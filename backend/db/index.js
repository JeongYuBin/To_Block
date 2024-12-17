const mongoose = require("mongoose");

const uri = "mongodb+srv://hrpark:Y3LplbJpL8hr3W1y@hrpark.h6uhx.mongodb.net/neuroboosters?retryWrites=true&w=majority";

async function connectDB() {
	try {
	  console.log('MongoDB 연결 시도 중...');
	  await mongoose.connect(uri);  // 옵션 제거
	  console.log('MongoDB 연결 성공!');
	} catch (error) {
	  console.error('MongoDB 연결 실패:', error);
	  throw error;
	}
}
module.exports = connectDB;