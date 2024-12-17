import React, { useState } from 'react';
import axios from 'axios';
import RectangleBtn from '../assets/rectangle-button.svg?react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function MultiRoomCreate() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');

  const handleCreateRoom = async () => {
    const userId = localStorage.getItem('userId');

    if (!roomName) {
      alert('방 이름을 입력해주세요.');
      return;
    }
    if (!userId) {
      alert('로그인이 필요합니다. 다시 로그인 해주세요.');
      navigate('/login');
      return;
    }

    try {
      // API 호출
      const response = await axios.post('/api/rooms/create', {
        roomName,
        mode: 'multi-mode', // 기본 모드는 'multi-mode'로 설정
        userId, // 요청에 userId 포함
      });

      // 서버로부터 방 생성 완료 시 응답 데이터 가져오기
      if (response.data.code === 200) {
        const { room } = response.data;
        navigate(`/waiting-room/${room.roomid}`, {
          state: { roomName: room.name, gameMode: room.mode },
        });
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      if (error.response) {
        // 서버에서 반환한 메시지가 있을 경우 표시
        const serverMessage = error.response.data.message;
        alert(serverMessage || '방 생성 중 문제가 발생했습니다.');
      } else {
        // 네트워크 또는 기타 에러
        alert('서버와 연결할 수 없습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex flex-col items-center justify-center mt-[160px]">
        <div className="flex flex-col items-start w-[600px]">
          <h2 className="text-[24px] mb-8">생성할 방의 이름을 입력해주세요.</h2>
        </div>

        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="w-[600px] h-[60px] text-left text-xl px-6 border border-neonblue bg-transparentdarkblue rounded-3xl focus:outline-none focus:border-pink "
        />

        {/* 생성 버튼 */}
        <div className="flex mt-[64px]">
          <button
            onClick={handleCreateRoom}
            className="relative flex items-center justify-center w-[240px] h-[48px] hover:text-pink"
          >
            <RectangleBtn className="w-full h-full" />
            <span className="absolute text-xl">생성</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MultiRoomCreate;
