import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProfileIcon from '../assets/profileicon.svg?react';
import RectangleBtn from '../assets/rectangle-button.svg?react';
import axios from 'axios';
import socket from '../services/socket';

function WaitingRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();
  const currentUserId = localStorage.getItem('userId');
  const { roomName } = location.state || {};
  const [participants, setParticipants] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    let isSubscribed = true;

    if (!roomId) {
      alert('방 정보가 올바르지 않습니다. 다시 시도해주세요.');
      navigate(-1);
      return;
    }

    const fetchRoomData = async () => {
      try {
        const response = await axios.get(`/api/rooms/${roomId}/waiting`);
        const { room } = response.data;
        if (isSubscribed) {
          setParticipants(room.players);
          setMaxPlayers(room.maxPlayers);
          const owner = room.players.find((player) => player.isOwner);
          setIsOwner(owner?.id === currentUserId);
        }
      } catch (error) {
        console.error('대기 화면 데이터 로드 중 오류 발생:', error);
        if (isSubscribed) {
          alert('대기 화면을 불러오는 중 문제가 발생했습니다.');
          navigate(-1);
        }
      }
    };

    fetchRoomData();
    socket.emit('joinWaitingRoom', roomId);

    const handleRoomUpdate = (updatedRoom) => {
      if (isSubscribed) {
        setParticipants(updatedRoom.players);
        const owner = updatedRoom.players.find((player) => player.isOwner);
        setIsOwner(owner?.id === currentUserId);
      }
    };

    const handleGameStart = (startedRoomId) => {
      if (startedRoomId === roomId && isSubscribed) {
        navigate(`/multi-gameplay/${roomId}`, {
          state: {
            roomName,
            messages,
            participants,
          },
        });
      }
    };

    socket.on('waitingRoomUpdate', handleRoomUpdate);
    socket.on('roomDelete', (deletedRoomId) => {
      if (deletedRoomId === roomId && isSubscribed) {
        navigate('/multi-room-join');
      }
    });
    socket.on('gameStarted', handleGameStart);
    socket.on('receiveMessage', (messageData) => {
      if (isSubscribed) {
        setMessages((prev) => [...prev, messageData]);
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    });

    return () => {
      isSubscribed = false;
      socket.off('waitingRoomUpdate', handleRoomUpdate);
      socket.off('roomDelete');
      socket.off('gameStarted', handleGameStart);
      socket.off('receiveMessage');
    };
  }, [roomId, navigate, currentUserId, roomName]); // 의존성 배열에서 messages와 participants 제거

  const leaveRoom = async () => {
    try {
      await axios.delete(`/api/rooms/${roomId}/leave`, {
        data: { userId: currentUserId },
      });
      navigate(-1);
    } catch (error) {
      console.error('방 나가기 중 오류 발생:', error);
      alert('방을 나가는 중 문제가 발생했습니다.');
    }
  };

  const startGame = () => {
    if (isOwner && participants.length >= 2) {
      socket.emit('gameStart', roomId);
      //   navigate(`/multi-game-play/${roomId}`, {
      //     state: { roomName, messages }
      //   });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit('sendMessage', {
        roomId,
        userId: currentUserId,
        message: newMessage.trim(),
      });
      setNewMessage('');
    }
  };

  const renderParticipants = () => {
    const emptySpots = maxPlayers - participants.length;

    return (
      <div className="flex items-center space-x-4">
        {participants.map((p) => (
          <div key={p.id} className="flex flex-col items-center">
            <div className="relative">
              {p.isOwner && (
                <div className="absolute text-yellow-400 transform -translate-x-1/2 -top-4 left-1/2">👑</div>
              )}
              <ProfileIcon className="w-[64px] h-[64px] text-neonblue" />
            </div>
            <span>{p.name || p.id}</span>
          </div>
        ))}
        {[...Array(emptySpots)].map((_, i) => (
          <div key={`empty-${i}`} className="flex flex-col items-center text-gray-600">
            <ProfileIcon className="w-[64px] h-[64px]" />
            <span>-</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChat = () => {
    return (
      <div className="flex flex-col h-[300px] w-[400px] bg-opacity-20 bg-black rounded-lg p-4">
        <div ref={chatContainerRef} className="flex-1 px-2 mb-4 space-y-2 overflow-y-auto custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.userId === currentUserId ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-2 rounded-lg ${
                  msg.userId === currentUserId ? 'bg-neonblue text-darkblue ml-auto' : 'bg-gray-700 text-neonblue'
                }`}
              >
                <div className="text-sm">{msg.userId === currentUserId ? currentUserId : msg.userId}</div>
                <div className="break-words">{msg.message}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 p-2 border rounded-lg bg-darkblue border-neonblue text-neonblue"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-neonblue text-darkblue hover:bg-blue-400">
            전송
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-darkblue text-neonblue">
      <div
        className="w-[1200px] h-[720px] flex flex-col items-center"
        style={{
          backgroundImage: `url(/assets/panel-wait.svg)`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <h2 className="mt-12 text-2xl">방 이름: "{roomName}"</h2>
        <div className="flex flex-col items-center justify-center h-full">
          {renderParticipants()}

          <div className="mt-4">{renderChat()}</div>

          <p className="mt-4 text-lg">다른 참가자를 기다리는 중입니다.</p>
          <p className="text-lg">{`${participants.length} / ${maxPlayers}`}</p>
          <div className="flex space-x-8">
            {isOwner && participants.length >= 2 && (
              <button
                onClick={startGame}
                className="relative flex items-center justify-center w-[200px] h-[40px] mt-4 hover:text-pink"
              >
                <RectangleBtn className="w-full h-full" />
                <span className="absolute text-lg">게임 시작</span>
              </button>
            )}
            <button
              onClick={leaveRoom}
              className="relative flex items-center justify-center w-[200px] h-[40px] mt-4 hover:text-pink"
            >
              <RectangleBtn className="w-full h-full" />
              <span className="absolute text-lg">나가기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaitingRoom;
