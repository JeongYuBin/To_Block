import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function AdminView() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // 유저 데이터를 저장할 상태
  const [loading, setLoading] = useState(true); // 로딩 상태 관리

  // 로그아웃 처리 함수
  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // 토큰 삭제
    navigate('/'); // 홈 화면으로 이동
  };

  // 유저 데이터 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // 토큰 포함
          },
        });

        setUsers(response.data.data); // 유저 데이터 저장
      } catch (error) {
        console.error('Error fetching users:', error.message);
      } finally {
        setLoading(false); // 로딩 완료
      }
    };

    fetchUsers();
  }, []);

  // 유저 클릭 시 기록 페이지로 이동
  const handleUserClick = (userId) => {
    navigate(`/user-record/${userId}`); // 유저 기록 페이지로 이동
  };

  return (
    <div className="flex flex-col min-h-screen bg-darkblue">
      <Navbar />

      {/* 관리자 뷰 패널 */}
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
            <h2 className="text-[32px] font-bold">관리자 뷰</h2>
          </div>

          {/* 유저 리스트 */}
          <div className="w-full px-[60px] max-h-[480px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <p className="text-center text-white">유저 데이터를 불러오는 중...</p>
            ) : users.length > 0 ? (
              users.map((user, index) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between py-8 border-b border-gray-600 cursor-pointer"
                  onClick={() => handleUserClick(user._id)} // 유저 클릭 시 이동
                >
                  <div className="flex w-[320px] mx-4 items-center space-x-4">
                    <span className="w-[48px] text-center text-2xl">{index + 1}</span>
                    <span className="text-xl text-center">{user._id}</span>
                  </div>
                  <div className="flex items-center mx-4 space-x-4">
                    <span>최근 접속: {new Date(user.lastAccessDate).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-white">조회할 유저가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminView;
