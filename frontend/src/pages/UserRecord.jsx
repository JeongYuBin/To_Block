import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function UserRecord() {
  const { userId } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRecord = async () => {
      try {
        console.log('Fetching records for user:', userId); // 요청 시작 로그
        const response = await axios.post(
          '/api/users/record',
          { user_id: userId },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          },
        );
        console.log('Server response:', response.data); // 서버 응답 로그

        setRecords(response.data.data.games);
      } catch (err) {
        console.error('Error fetching records:', err); // 에러 로그
        const message = err.response?.data?.message || '기록을 불러오는데 실패했습니다.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecord();
  }, [userId]);

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
          {/* 고정된 상단 영역 */}
          <div className="w-full px-[60px] py-4 text-center z-10">
            <h2 className="text-[32px] font-bold">{`${userId}의 유저 기록`}</h2>
          </div>

          <div className="flex flex-col items-center w-[1000px] h-[640px]">
            <div className="w-full px-[60px] max-h-[480px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <p className="text-center text-white">기록을 불러오는 중...</p>
              ) : error ? (
                <p className="text-center text-red-500">{error}</p>
              ) : records.length > 0 ? (
                records.map((record, index) => (
                  <div key={index} className="flex items-center justify-between py-8 border-b border-gray-600">
                    <div className="flex w-[320px] mx-4 items-center space-x-4">
                      <span className="w-[48px] text-center text-2xl">{index + 1}</span>
                      <span>{record.game_name}</span>
                    </div>
                    <div className="flex items-center mx-4 space-x-8">
                      <span>{new Date(record.date).toLocaleString()}</span>
                      <div className="flex flex-col space-y-2">
                        {record.result[1] && <span className="text-blue-600">1등: {record.result[1].join(', ')}</span>}
                        {record.result[2] && <span className="text-blue-400">2등: {record.result[2].join(', ')}</span>}
                        {record.result[3] && <span className="text-blue-200">3등: {record.result[3].join(', ')}</span>}
                      </div>
                      <span className="font-bold">
                        {record.result[1]?.includes(userId)
                          ? '🥇'
                          : record.result[2]?.includes(userId)
                            ? '🥈'
                            : record.result[3]?.includes(userId)
                              ? '🥉'
                              : ''}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-white">게임 기록이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRecord;
