//회원가입 화면
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RectangleBtn from '../assets/rectangle-button.svg?react';
import { useNavigate } from 'react-router-dom';
import SquareBtn from '../assets/square-button.svg?react';
import HomeIcon from '../assets/homeicon.svg?react';
import BackIcon from '../assets/backicon.svg?react';

function SignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: '',
    password: '',
  });
  const [error, setError] = useState(null);

  // 페이지 로드 시 토큰 확인 및 리다이렉트
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/'); // 이미 로그인된 경우 메인 페이지로 이동
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      // Reset error state
      setError(null);

      const response = await axios.post('/api/users/signup', {
        nickname: 'abc',
        id: form.id,
        pw: form.password,
      });

      if (response.status === 200) {
        navigate('/login');
      }
    } catch (err) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
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
      <div className="flex justify-center flex-grow mt-2">
        <div
          className="w-[1000px] h-[560px] flex flex-col items-center"
          style={{
            backgroundImage: `url(/assets/panel-login.svg)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <h1 className="text-[48px] font-bold text-center mt-8 mb-[100px]">Sign Up</h1>
          <div className="flex flex-col items-center space-y-6">
            <input
              type="text"
              name="id"
              placeholder="ID"
              value={form.id}
              onChange={handleChange}
              className="w-[320px] h-[40px] text-left px-3 border border-neonblue bg-transparentdarkblue rounded-2xl focus:outline-none focus:border-pink"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-[320px] h-[40px] text-left px-3 border border-neonblue bg-transparentdarkblue rounded-2xl focus:outline-none focus:border-pink"
            />
          </div>

          {error && <p className="mt-4 text-pink">{error}</p>}

          <button
            onClick={handleSubmit}
            className="relative flex items-center justify-center w-[200px] h-[40px] mt-10 hover:text-pink"
          >
            <RectangleBtn />
            <span className="absolute">회원가입</span>
          </button>

          <a href="/login" className="mt-4 text-xs underline hover:text-pink">
            로그인
          </a>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
