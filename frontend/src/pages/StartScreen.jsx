import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BgStart from '../assets/bg-start.svg';
import PlayBtn from '../assets/play-button.svg?react';
import SquareBtn from '../assets/square-button.svg?react';
import ProfileIcon from '../assets/profileicon.svg?react';
import GameSettingsIcon from '../assets/gameicon.svg?react';

function StartScreen() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리

  // 프로필 버튼 클릭 처리
  const handleProfileClick = () => {
    const userId = localStorage.getItem('userId'); // localStorage에서 userId 가져오기

    if (userId === 'admin') {
      navigate('/admin-view'); // admin인 경우 admin-view로 이동
    } else if (isLoggedIn) {
      navigate(`/user-record/${userId}`); // 로그인 상태인 경우 유저 기록 화면으로 이동
    } else {
      alert('로그인 후 이용 가능합니다.'); // 비로그인 상태에서는 경고 메시지
    }
  };

  // 모달 열기/닫기 함수
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token); // 토큰이 있으면 로그인 상태로 설정
  }, []);

  // 로그아웃 처리 함수
  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // 토큰 삭제
    setIsLoggedIn(false); // 로그인 상태 업데이트
    navigate('/'); // 홈 화면으로 이동
  };

  // 플레이 버튼 클릭 처리
  const handlePlayClick = () => {
    if (!isLoggedIn) {
      alert('로그인 후에 플레이할 수 있습니다.'); // 경고 메시지
      return;
    }
    navigate('/room-choice'); // 로그인된 상태에서만 이동
  };

  return (
    <div className="flex flex-col min-h-screen bg-darkblue">
      {/* 상단 텍스트 */}
      <div className="flex justify-end text-2xl space-x-[32px] mr-[48px] mt-[32px]">
        {isLoggedIn ? (
          <button onClick={handleLogout} className="hover:text-pink">
            Log Out
          </button>
        ) : (
          <>
            <button onClick={() => navigate('/login')} className="hover:text-pink">
              Log In
            </button>
            <button onClick={() => navigate('/signup')} className="hover:text-pink">
              Sign Up
            </button>
          </>
        )}
      </div>

      {/* 메인 패널 */}
      <div className="relative flex flex-col items-center">
        <img src="/assets/panel-main.svg" alt="Main Panel" className="mt-[48px]" />
        <h1 className="absolute top-1/2 transform -translate-y-1/2 text-[160px] font-bold text-center">To Block</h1>
      </div>

      {/* PLAY 버튼 */}
      <button
        className={`relative flex justify-center items-center mt-[16px] mx-auto ${
          isLoggedIn ? 'hover:text-pink' : 'cursor-not-allowed opacity-50'
        }`}
        onClick={handlePlayClick} // 로그인 여부에 따라 처리
        disabled={!isLoggedIn} // 로그인되지 않은 상태에서는 버튼 비활성화
      >
        <PlayBtn />
        <span className="absolute text-[32px] font-bold">PLAY</span>
      </button>

      <div className="flex items-end justify-center flex-grow ">
        <img src={BgStart} alt="Background Decoration" className="object-cover w-full pb-8" />
      </div>

      {/* 하단 아이콘 버튼들 */}
      <div className="absolute w-full bottom-10">
        <div className="flex justify-center space-x-[80px]">
          {/* Profile Button */}
          <button onClick={handleProfileClick} className="relative flex items-center justify-center hover:text-pink">
            <SquareBtn />
            <ProfileIcon className="absolute" />
          </button>

          {/* Game Settings Button */}
          <button
            className="relative flex items-center justify-center hover:text-pink"
            onClick={toggleModal} // 모달 열기
          >
            <SquareBtn />
            <GameSettingsIcon className="absolute" />
          </button>
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-darkblue p-6 rounded-xl w-[1000px] space-y-4 border border-neonblue">
            <h2 className="mb-4 text-2xl font-bold text-center">게임 설명</h2>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">솔로모드</h3>
              <p className="text-gray-300">
                단독으로 큐브 쌓기 게임을 진행하며 정해진 시간 내 목표를 완성하면 승리합니다.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">멀티모드</h3>
              <p className="text-gray-300">다른 플레이어와 경쟁하며 더 빠르게 큐브를 완성하면 승리합니다.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">방 생성 및 선택</h3>
              <p className="text-gray-300">멀티모드에서는 방을 생성하거나 기존 방에 참여할 수 있습니다.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">게임 진행 키</h3>
              <ul className="text-gray-300 list-disc list-inside">
                <li>W: 큐브를 앞으로 이동</li>
                <li>S: 큐브를 뒤로 이동</li>
                <li>A: 큐브를 왼쪽으로 이동</li>
                <li>D: 큐브를 오른쪽으로 이동</li>
                <li>1: 큐브를 1층으로 이동</li>
                <li>2: 큐브를 2층으로 이동</li>
                <li>3: 큐브를 3층으로 이동</li>
                <li>Enter: 큐브를 고정/삭제</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold ">게임 룰</h3>
              <p className="text-gray-300">큐브는 반드시 아래에 큐브가 있어야 쌓을 수 있습니다.</p>
            </div>
            <div className="flex justify-end mt-4 space-x-4">
              <button
                onClick={toggleModal}
                className="px-4 py-2 bg-transparent border rounded border-neonblue text-neonblue hover:bg-neonblue hover:text-darkblue"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StartScreen;
