// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StartScreen from './pages/StartScreen';
import Login from './pages/Login';
import SignUp from './pages/Signup';
import RoomChoice from './pages/RoomChoice';
import MultiRoomCreate from './pages/MultiRoomCreate';
import MultiRoomJoin from './pages/MultiRoomJoin';
import WaitingRoom from './pages/WaitingRoom';
import MultiGamePlay from './pages/MultiGamePlay';
import MultiResult from './pages/MultiResult';
import AdminView from './pages/AdminView';
import UserRecord from './pages/UserRecord';

function BackgroundContainer({ children }) {
  return (
    <div
      style={{
        backgroundImage: `url(/assets/bg-main.svg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'bottom',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}

function App() {
  return (
    <Router>
      <BackgroundContainer>
        <Routes>
          <Route path="/" element={<StartScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/room-choice" element={<RoomChoice />} />
          <Route path="/multi-room-create" element={<MultiRoomCreate />} />
          <Route path="/multi-room-join" element={<MultiRoomJoin />} />
          <Route path="/waiting-room/:roomId" element={<WaitingRoom />} />
          <Route path="/multi-gameplay/:roomId" element={<MultiGamePlay />} />
          <Route path="/multi-result" element={<MultiResult />} />
          <Route path="/admin-view" element={<AdminView />} />
          <Route path="/user-record/:userId" element={<UserRecord />} />
        </Routes>
      </BackgroundContainer>
    </Router>
  );
}

export default App;
