import React, { useEffect, useState } from 'react';
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
  
	useEffect(() => {
	  if (!roomId) {
		alert('방 정보가 올바르지 않습니다. 다시 시도해주세요.');
		navigate(-1);
		return;
	  }
  
	  const fetchRoomData = async () => {
		try {
		  const response = await axios.get(`/api/rooms/${roomId}/waiting`);
		  const { room } = response.data;
		  setParticipants(room.players);
		  setMaxPlayers(room.maxPlayers);
		} catch (error) {
		  console.error('대기 화면 데이터 로드 중 오류 발생:', error);
		  alert('대기 화면을 불러오는 중 문제가 발생했습니다.');
		  navigate(-1);
		}
	  };
  
	  fetchRoomData();
  
	  // 소켓 이벤트 구독
	  socket.emit('joinWaitingRoom', roomId);
  
	  // 실시간 방 정보 업데이트 수신
	  socket.on('waitingRoomUpdate', (updatedRoom) => {
		setParticipants(updatedRoom.players);
	  });
  
	  // 방 삭제 이벤트 수신 (방장이 나가서 방이 삭제된 경우)
	  socket.on('roomDelete', (deletedRoomId) => {
		if (deletedRoomId === roomId) {
		  navigate('/multi-room-join');
		}
	  });
  
	  return () => {
		socket.off('waitingRoomUpdate');
		socket.off('roomDelete');
		socket.emit('leaveWaitingRoom', roomId);
	  };
	}, [roomId, navigate]);
  
	// 방 나가기 기능
	const leaveRoom = async () => {
	  try {
		await axios.delete(`/api/rooms/${roomId}/leave`, {
		  data: { userId: currentUserId },
		});
		
		// 서버 응답을 기다리지 않고 바로 이동 (소켓 이벤트가 처리할 것임)
		navigate('/multi-room-join');
	  } catch (error) {
		console.error('방 나가기 중 오류 발생:', error);
		alert('방을 나가는 중 문제가 발생했습니다.');
	  }
	};
  
	const renderParticipants = () => {
	  const emptySpots = maxPlayers - participants.length;
  
	  return (
		<div className="flex items-center mt-4 space-x-4">
		  {participants.map((p) => (
			<div key={p.id} className="flex flex-col items-center">
			  <ProfileIcon className="w-[64px] h-[64px] text-neonblue" />
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
		  <h2 className="mt-16 text-2xl">방 이름: "{roomName}"</h2>
		  <div className="flex flex-col items-center justify-center h-full">
			{renderParticipants()}
			
			<p className="mt-8 text-lg">다른 참가자를 기다리는 중입니다.</p>
			<p className="text-lg">{`${participants.length} / ${maxPlayers}`}</p>
  
			<button
			  onClick={leaveRoom}
			  className="relative flex items-center justify-center w-[200px] h-[40px] mt-12 hover:text-pink"
			>
			  <RectangleBtn className="w-full h-full" />
			  <span className="absolute text-lg">나가기</span>
			</button>
		  </div>
		</div>
	  </div>
	);
  }

export default WaitingRoom;