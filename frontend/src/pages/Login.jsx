//로그인 화면
import React, { useState, useEffect } from 'react';
import RectangleBtn from '../assets/rectangle-button.svg?react';
import { useNavigate } from 'react-router-dom';
import SquareBtn from '../assets/square-button.svg?react';
import HomeIcon from '../assets/homeicon.svg?react';
import BackIcon from '../assets/backicon.svg?react';
import axios from 'axios'; // API 요청을 위해 Axios 사용

function Login() {
  const navigate = useNavigate();

  // 입력 상태 관리
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  // 페이지 로드 시 토큰 확인 및 리다이렉트
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/'); // 이미 로그인된 경우 메인 페이지로 이동
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!id || !password) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      // 서버에 로그인 요청
      const response = await axios.post('/api/users/login', { id, pw: password });

      // 로그인 성공 시
      if (response.status === 200) {
        const { user, accessToken } = response.data;

        console.log('로그인 성공:', user.id, accessToken);
        // userId와 accessToken을 로컬 스토리지에 저장
        localStorage.setItem('userId', user.id); // MongoDB의 _id
        localStorage.setItem('accessToken', accessToken);

        // 알림 및 메인 화면으로 이동
        navigate('/');
      }
    } catch (error) {
      // 에러 처리
      if (error.response) {
        alert(error.response.data.message || '로그인 실패');
      } else {
        alert('서버와 연결할 수 없습니다.');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
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
      </div>
      <div className="flex justify-center mt-2">
        <div
          className="w-[1000px] h-[560px] flex flex-col items-center"
          style={{
            backgroundImage: `url(/assets/panel-login.svg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <h1 className="text-[48px] font-bold text-center mt-8 mb-[100px]">Log In</h1>
          <div className="flex flex-col items-center space-y-6">
            <input
              type="text"
              placeholder="ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-[320px] h-[40px] text-left px-3 border border-neonblue bg-transparentdarkblue rounded-2xl focus:outline-none focus:border-pink"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-[320px] h-[40px] text-left px-3 border border-neonblue bg-transparentdarkblue rounded-2xl focus:outline-none focus:border-pink"
            />
          </div>

          <button
            onClick={handleLogin}
            className="relative flex items-center justify-center w-[200px] h-[40px] mt-10 hover:text-pink"
          >
            <RectangleBtn />
            <span className="absolute">로그인</span>
          </button>

          <a href="/signup" className="mt-4 text-xs underline hover:text-pink">
            회원가입
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
