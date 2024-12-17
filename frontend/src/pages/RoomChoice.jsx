//방 생성/참가 선택 화면
import React, { useState } from 'react';
import SquareBtn from '../assets/square-button.svg?react';
import RoomCreateIcon from '../assets/room-create-icon.svg?react';
import RoomJoinIcon from '../assets/room-join-icon.svg?react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function RoomChoice() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex justify-center flex-grow space-x-[160px] mt-[40px] h-[400px]">
        <button
          onClick={() => navigate('/multi-room-create')}
          className="relative w-[400px] h-[400px] flex items-center justify-center cursor-pointer font-bold hover:text-pink"
        >
          <SquareBtn className="w-full h-full" />
          <div className="absolute flex flex-col">
            <h2 className="text-[32px]">방 생성</h2>
            <RoomCreateIcon />
          </div>
        </button>

        <button
          onClick={() => navigate('/multi-room-join')}
          className="relative w-[400px] h-[400px] flex items-center justify-center cursor-pointer font-bold hover:text-pink"
        >
          <SquareBtn className="w-full h-full" />
          <div className="absolute flex flex-col ">
            <h2 className="text-[32px]">방 참가</h2>
            <RoomJoinIcon />
          </div>
        </button>
      </div>
    </div>
  );
}

export default RoomChoice;
