import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileIcon from '../assets/profileicon.svg?react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import socket from '../services/socket';

function MultiRoomJoin() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState('전체');

  useEffect(() => {
    // 초기 방 목록 가져오기
    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/rooms/list');
        const filteredRooms = response.data.rooms.filter((room) => room.mode === 'multi-mode');
        setRooms(filteredRooms);
      } catch (error) {
        console.error('방 목록 로드 중 오류 발생:', error);
        alert('방 목록을 불러오는 중 문제가 발생했습니다.');
      }
    };

    fetchRooms();

    // 소켓 이벤트 리스너
    socket.emit('joinLobby');

    socket.on('roomUpdate', (updatedRoom) => {
      setRooms((prevRooms) => {
        // playing 상태인 방은 업데이트하지 않음
        if (updatedRoom.mode === 'playing') {
          // playing 상태인 방은 목록에서 제거
          return prevRooms.filter((room) => room.roomid !== updatedRoom.roomid);
        }

        // 기존 방 목록에서 업데이트된 방 찾기
        const roomIndex = prevRooms.findIndex((room) => room.roomid === updatedRoom.roomid);
        if (roomIndex !== -1) {
          // 방이 존재하면 업데이트
          const newRooms = [...prevRooms];
          newRooms[roomIndex] = updatedRoom;
          return newRooms;
        } else {
          // 새로운 방이면 목록에 추가
          return [...prevRooms, updatedRoom];
        }
      });
    });

    socket.on('roomDelete', (deletedRoomId) => {
      setRooms((prevRooms) => prevRooms.filter((room) => room.roomid !== deletedRoomId));
    });

    // Cleanup
    return () => {
      socket.off('roomUpdate');
      socket.off('roomDelete');
      socket.emit('leaveLobby');
    };
  }, []);

  const renderPlayerIcons = (players) => {
    const maxPlayers = 4;
    return (
      <div className="flex items-center space-x-2">
        {[...Array(maxPlayers)].map((_, index) => (
          <ProfileIcon
            key={index}
            className={`inline-block w-6 h-6 rounded-full ${index < players.length ? '' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

  const handleRoomClick = async (room) => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      alert('로그인이 필요합니다. 다시 로그인 해주세요.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post('/api/rooms/join', {
        roomName: room.name,
        userId,
      });

      if (response.data.code === 200) {
        navigate(`/waiting-room/${room.roomid}`, {
          state: { roomName: room.name, gameMode: 'team' },
        });
      } else {
        alert(response.data.message || '방 참가에 실패했습니다.');
      }
    } catch (error) {
      console.error('방 참가 중 오류 발생:', error);
      alert('방 참가 중 문제가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-darkblue">
      <Navbar />
      <div className="flex justify-center mt-4">
        <div
          className="w-[1000px] h-[640px] flex flex-col items-center"
          style={{
            backgroundImage: `url(/assets/panel-room.svg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="flex justify-between w-full px-[60px] mt-10 mb-4">
            <h2 className="text-[24px]">방 목록</h2>
          </div>
          <div className="w-full px-[60px] max-h-[480px] overflow-y-auto custom-scrollbar">
            {rooms.length > 0 ? (
              rooms
                .slice() // 원본 배열을 복사
                .reverse() // 복사본을 역순으로 정렬
                .map((room) => (
                  <div
                    key={room.roomid}
                    onClick={() => handleRoomClick(room)}
                    className="flex items-center justify-between py-8 border-b border-gray-600 last:border-none hover:text-pink"
                  >
                    <div className="flex w-[160px] justify-between mx-4">
                      <span>{room.name}</span>
                    </div>
                    <div className="flex items-center mx-4 space-x-4">
                      {renderPlayerIcons(room.players)}
                      <span>{`${room.players.length} / ${room.maxPlayers}`}</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="mt-10 text-center text-gray-400">방이 없습니다. 새로 생성해주세요.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiRoomJoin;
