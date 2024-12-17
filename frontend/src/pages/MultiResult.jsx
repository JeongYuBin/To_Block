import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SquareBtn from '../assets/square-button.svg?react';
import HomeIcon from '../assets/homeicon.svg?react';
import { useNavigate } from 'react-router-dom';

function MultiResult() {
  const navigate = useNavigate();
  const [gameResult, setGameResult] = useState(null);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchLatestGame = async () => {
      try {
        const response = await axios.post('/api/users/latest-game', 
          { user_id: userId },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );
        setGameResult(response.data.data);
      } catch (err) {
        console.error('Error fetching game result:', err);
        setError(err.response?.data?.message || '게임 결과를 불러오는데 실패했습니다.');
      }
    };

    fetchLatestGame();
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // 토큰 삭제
    navigate('/'); // 홈 화면으로 이동
  };

  return (
    <div className="flex flex-col min-h-screen bg-darkblue">
      <div className="flex justify-end text-2xl space-x-[32px] mr-[48px] mt-[32px]">
        <button onClick={handleLogout}>Log Out</button>
      </div>
      <div className="flex justify-center mt-10">
        <div className="w-[1000px] h-[640px] flex flex-col items-center"
          style={{
            backgroundImage: `url(/assets/panel-room.svg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}>
          <div className="flex flex-col items-center justify-center w-[1000px] h-[640px]">
            <h2 className="text-[32px] font-bold">게임 결과</h2>
            <div className="w-full px-[60px] max-h-[480px] overflow-y-auto custom-scrollbar">
              {error ? (
                <p className="text-center text-red-500">{error}</p>
              ) : gameResult && (
                <>
                  {/* 1등 */}
                  {gameResult.result[1]?.map((userId) => (
                    <div key={userId} className="flex items-center justify-between py-8 border-b border-gray-600">
                      <div className="flex w-[160px] justify-between mx-4 items-center">
                        <span className="w-[48px] text-center text-3xl">1</span>
                        <span>{userId}</span>
                      </div>
                      <span className="text-neonblue">🥇 우승</span>
                    </div>
                  ))}
                  
                  {/* 2등 */}
                  {gameResult.result[2]?.map((userId) => (
                    <div key={userId} className="flex items-center justify-between py-8 border-b border-gray-600">
                      <div className="flex w-[160px] justify-between mx-4 items-center">
                        <span className="w-[48px] text-center text-3xl">2</span>
                        <span>{userId}</span>
                      </div>
                      <span>🥈</span>
                    </div>
                  ))}

                  {/* 3등 */}
                  {gameResult.result[3]?.map((userId) => (
                    <div key={userId} className="flex items-center justify-between py-8 border-b border-gray-600">
                      <div className="flex w-[160px] justify-between mx-4 items-center">
                        <span className="w-[48px] text-center text-3xl">3</span>
                        <span>{userId}</span>
                      </div>
                      <span>🥉</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => navigate('/')}
                className="relative flex items-center justify-center hover:text-pink"
              >
                <SquareBtn className="w-[64px] h-[64px] " />
                <HomeIcon className="absolute" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiResult;