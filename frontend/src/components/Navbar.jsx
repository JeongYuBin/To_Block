import React from 'react';
import SquareBtn from '../assets/square-button.svg?react';
import HomeIcon from '../assets/homeicon.svg?react';
import BackIcon from '../assets/backicon.svg?react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  // 로그아웃 처리 함수
  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // 토큰 삭제
    navigate('/'); // 홈 화면으로 이동
  };

  return (
    <div className="flex justify-between p-6">
      <div className="flex space-x-6">
        <button onClick={() => navigate('/')} className="relative flex items-center justify-center hover:text-pink">
          <SquareBtn className="w-[64px] h-[64px] " />
          <HomeIcon className="absolute" />
        </button>
        <button onClick={() => navigate(-1)} className="relative flex items-center justify-center hover:text-pink">
          <SquareBtn className="w-[64px] h-[64px] " />
          <BackIcon className="absolute" />
        </button>
      </div>
      <div className="flex h-[32px] justify-end text-2xl mr-[24px] mt-[8px] hover:text-pink">
        <button onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}

export default Navbar;
