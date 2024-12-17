//멀티모드 게임 진행 화면
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import socket from '../services/socket';
import RoundModal from '../components/RoundModal';
import SwitchIcon from '../assets/switch-icon.svg?react';

function fillMatrix(positions) {
  // 3x3x3 0으로 초기화된 매트릭스 생성
  const matrix = Array(3)
    .fill()
    .map(() =>
      Array(3)
        .fill()
        .map(() => Array(3).fill(0)),
    );

  // 주어진 좌표 리스트의 위치를 1로 설정
  for (const [x, y, z] of positions) {
    if (x >= 0 && x < 3 && y >= 0 && y < 3 && z >= 0 && z < 3) {
      matrix[y][z][x] = 1;
    } else {
      console.warn(`Invalid position: (${x}, ${y}, ${z})`);
    }
  }

  return matrix;
}

function MultiGamePlay() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();
  const { roomName, messages: initialMessages = [] } = location.state || {};
  const currentUserId = localStorage.getItem('userId');
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const isLockedRef = useRef(isLocked);

  const [isSwitched, setIsSwitched] = useState(false); // 왼쪽/오른쪽 스위칭 상태
  const mountRef = useRef(null);
  const [fixedPositions, setFixedPositions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameOver, setGameOver] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [currentRound, setCurrentRound] = useState(1); // 현재 라운드
  const [showModal, setShowModal] = useState(true); // 모달 표시 여부
  const chatContainerRef = useRef(null);
  const cubeRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [rounds, setRounds] = useState({
    round1: {},
    round2: {},
    round3: {},
  });
  const [frontView, setFrontView] = useState([]);
  const [sideView, setSideView] = useState([]);
  const [topView, setTopView] = useState([]);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const updateRoundData = (data) => {
      const currentRoundData = currentRound === 1 ? data.round1 : currentRound === 2 ? data.round2 : data.round3;

      if (currentRoundData) {
        setFrontView(currentRoundData.front || []);
        setSideView(currentRoundData.side || []);
        setTopView(currentRoundData.top || []);
      }
    };

    socket.on('gameData', (data) => {
      console.log('Game data received:', data);
      setRounds({
        round1: data.round1,
        round2: data.round2,
        round3: data.round3,
      });
      updateRoundData(data); // 라운드 데이터 업데이트
    });

    // 라운드 변경 시 업데이트
    updateRoundData(rounds);

    socket.on('receiveMessage', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('gameData');
    };
  }, [currentRound]);

  useEffect(() => {
    console.log('gameData 업데이트됨:', rounds);
  }, [rounds]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit('sendMessage', {
        roomId,
        userId: currentUserId,
        message: newMessage.trim(),
      });
      setNewMessage('');
    }
  };

  const renderChat = () => {
    return (
      <div className="h-[300px] w-full bg-opacity-20 bg-black rounded-lg p-4 mb-10 z-10">
        <div ref={chatContainerRef} className="flex-1 h-[80%] overflow-y-auto mb-4 space-y-2">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.userId === currentUserId ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-2 rounded-lg ${
                  msg.userId === currentUserId ? 'bg-neonblue text-darkblue ml-auto' : 'bg-gray-700 text-neonblue'
                }`}
              >
                <div className="text-sm">{msg.userId}</div>
                <div className="break-words">{msg.message}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={() => setIsChatFocused(true)} // 포커스 시
            onBlur={() => setIsChatFocused(false)} // 포커스 해제 시
            placeholder="메시지를 입력하세요..."
            className="flex-1 p-2 border rounded-lg bg-darkblue border-neonblue text-neonblue"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-neonblue text-darkblue hover:bg-blue-400">
            {' '}
            전송{' '}
          </button>
        </form>
      </div>
    );
  };

  // 다음 라운드 시작
  const handleNextRound = () => {
    const nextRound = currentRound + 1; // 다음 라운드 계산
    if (nextRound > 3) {
      setGameOver(true); // 3라운드가 끝나면 게임 종료
      socket.emit('gameEnd', {
        roomName: roomName,
        roomId: roomId,
        userId: currentUserId,
      });
      return;
    }

    setShowModal(true); // 먼저 모달을 표시
    setTimeLeft(120); // 타이머 초기화
    setCurrentRound(nextRound); // 다음 라운드로 설정
    setIsLocked(false); // 잠금 해제
    handleResetView(); // 시점 초기화
    handleResetCube(); // 큐브 초기화
  };

  useEffect(() => {
    socket.on('toResult', () => {
      socket.emit('leaveGameRoom', {
        roomId: roomId,
        roomName: roomName,
        userId: currentUserId,
        opt: 1,
      });
      sessionStorage.removeItem('isReloaded');
      navigate('/multi-result');
    });

    return () => {
      socket.off('toResult');
    };
  }, [navigate, roomId, roomName, currentUserId]);

  // 3초 후 모달 닫기
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        setShowModal(false); // 모달 닫기
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const areAllPlayersComplete = () => {
    return roomPlayers.every((player) => userProgress[player.id] === 100);
  };

  useEffect(() => {
    let timer;

    const updateTimer = () => {
      setTimeLeft((prev) => {
        if (prev <= 1 || areAllPlayersComplete()) {
          clearTimeout(timer);
          setTimeout(() => {
            handleNextRound();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });

      timer = setTimeout(updateTimer, 1000); // 1초 간격으로 호출
    };

    if (!showModal && !gameOver) {
      timer = setTimeout(updateTimer, 1000);
    }

    return () => clearTimeout(timer);
  }, [showModal, gameOver, userProgress]);

  useEffect(() => {
    if (areAllPlayersComplete() && !gameOver && !showModal) {
      setTimeout(() => {
        handleNextRound();
      }, 2000);
    }
  }, [userProgress, gameOver, showModal]);

  const colors = [0x3498db, 0x1abc9c, 0xe74c3c]; // 각 층의 색상

  // 위치가 고정되었는지 확인하는 함수
  const isPositionFixed = (position) =>
    fixedPositions.some((fixed) => fixed[0] === position[0] && fixed[1] === position[1] && fixed[2] === position[2]);

  // 아래에 큐브가 있는지 확인하는 함수
  const hasCubeBelow = (position) => {
    if (position[1] === 0) return true;
    const belowPosition = [position[0], position[1] - 1, position[2]];
    return isPositionFixed(belowPosition);
  };

  useEffect(() => {
    const progress = userProgress[currentUserId] || 0;
    if (progress === 100 && !isLocked) {
      // 진행도가 100이고, 큐브가 잠금 상태가 아닐 때
      setShowCompleteModal(true);
      setIsLocked(true); // 조작 잠금

      // 1초 후 모달 닫기
      setTimeout(() => {
        setShowCompleteModal(false);
      }, 1000);
    }
  }, [userProgress, currentUserId, isLocked]);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  const toggleCubePosition = () => {
    const cube = cubeRef.current;
    if (!cube || gameOver || isLockedRef.current) return; // 게임 종료 또는 잠금 상태일 때 조작 불가

    const position = [Math.round(cube.position.x), Math.round(cube.position.y), Math.round(cube.position.z)];
    const [x, y, z] = position;

    if (isPositionFixed(position)) {
      setFixedPositions((prev) => {
        const newPositions = prev.filter((fixed) => !(fixed[0] === x && fixed[1] === y && fixed[2] === z));
        const matrix3d = fillMatrix(newPositions);
        // 큐브 제거 시 서버에 업데이트 전송
        socket.emit('updateCubeMatrix', {
          roomId,
          userId: currentUserId,
          matrix: matrix3d,
          currentRound: currentRound,
          position: position,
        });

        return newPositions;
      });

      sceneRef.current.children
        .filter(
          (child) =>
            child.userData.fixed &&
            Math.round(child.position.x) === x &&
            Math.round(child.position.y) === y &&
            Math.round(child.position.z) === z,
        )
        .forEach((fixedCube) => sceneRef.current.remove(fixedCube));
    } else {
      // if (!hasCubeBelow(position)) {
      //   setErrorMessage('이 위치에는 아래에 큐브가 있어야 놓을 수 있습니다.');
      //   setTimeout(() => {
      //     setErrorMessage(''); // 3초 후 메시지 숨기기
      //   }, 500);
      //   return;
      // }

      setFixedPositions((prev) => {
        const newPositions = [...prev, position];
        const matrix3d = fillMatrix(newPositions);
        console.log(matrix3d);
        // 큐브 추가 시 서버에 업데이트 전송
        socket.emit('updateCubeMatrix', {
          roomId: roomId,
          userId: currentUserId,
          currentRound: currentRound,
          matrix: matrix3d,
        });

        return newPositions;
      });

      const fixedMaterial = new THREE.MeshStandardMaterial({
        color: colors[y],
        roughness: 0.5,
        metalness: 0.3,
      });
      const fixedCube = new THREE.Mesh(cube.geometry.clone(), fixedMaterial);
      fixedCube.position.copy(cube.position);
      fixedCube.castShadow = true;
      fixedCube.receiveShadow = true;
      fixedCube.userData.fixed = true;
      sceneRef.current.add(fixedCube);
    }

    // // 진행도 업데이트
    // const totalCubes = targetPositions.flat(2).filter((cell) => cell === 1).length;
    // const placedCubes = fixedPositions.length;
    // setProgress(Math.min(Math.round((placedCubes / totalCubes) * 100), 100));
  };

  useEffect(() => {
    const isReloaded = sessionStorage.getItem('isReloaded');

    if (isReloaded) {
      // 새로고침 후 실행할 코드
      console.log('새로고침 후입니다');
      console.log('roome name', roomName);
      socket.emit('leaveGameRoom', {
        roomId: roomId,
        roomName: roomName,
        userId: currentUserId,
        opt: 0,
      });
      sessionStorage.removeItem('isReloaded');
      navigate('/');
    } else {
      // 첫 로드시
      let hasJoined = false;
      // 게임룸 입장
      if (!hasJoined) {
        socket.emit('joinGameRoom', {
          roomId,
          userId: currentUserId,
        });
        hasJoined = true;
      }
      sessionStorage.setItem('isReloaded', 'true');
    }
  }, []);

  useEffect(() => {
    // 방 참가자 정보 받기
    socket.on('roomPlayers', (players) => {
      setRoomPlayers(players);
    });

    // 진행도 업데이트 받기
    socket.on('progressUpdated', ({ userId, progress }) => {
      setUserProgress((prev) => ({
        ...prev,
        [userId]: progress,
      }));
    });

    return () => {
      socket.off('roomPlayers');
      socket.off('progressUpdated');
    };
  }, []);

  //   // useEffect에 매트릭스 업데이트 수신 리스너 추가
  //   useEffect(() => {
  //     socket.on('cubeMatrixUpdated', ({ userId, matrix, position }) => {
  //       if (userId !== currentUserId) {
  //         // 자신의 업데이트는 무시
  //         setFixedPositions(matrix);

  //         // 다른 플레이어의 큐브 시각적 업데이트
  //         const scene = sceneRef.current;
  //         if (scene) {
  //           // 이전 큐브들 제거
  //           const fixedCubes = scene.children.filter((child) => child.userData.fixed);
  //           fixedCubes.forEach((cube) => scene.remove(cube));

  //           // 새로운 매트릭스로 큐브 재생성
  //           matrix.forEach(([x, y, z]) => {
  //             const fixedMaterial = new THREE.MeshStandardMaterial({
  //               color: colors[y],
  //               roughness: 0.5,
  //               metalness: 0.3,
  //             });
  //             const geometry = new THREE.BoxGeometry(1, 1, 1);
  //             const fixedCube = new THREE.Mesh(geometry, fixedMaterial);
  //             fixedCube.position.set(x, y, z);
  //             fixedCube.userData.fixed = true;
  //             scene.add(fixedCube);
  //           });
  //         }
  //       }
  //     });

  //     return () => {
  //       socket.off('cubeMatrixUpdated');
  //     };
  //   }, []);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isChatFocused) return;

      const cube = cubeRef.current;
      const step = 1;
      if (!cube) return;

      switch (event.key) {
        case '1':
          cube.position.y = 0;
          break;
        case '2':
          cube.position.y = 1;
          break;
        case '3':
          cube.position.y = 2;
          break;
        case 'w':
        case 'ㅈ':
          cube.position.z -= step;
          break;
        case 's':
        case 'ㄴ':
          cube.position.z += step;
          break;
        case 'a':
        case 'ㅁ':
          cube.position.x -= step;
          break;
        case 'd':
        case 'ㅇ':
          cube.position.x += step;
          break;
        case 'Enter':
          toggleCubePosition();
          break;
        default:
          break;
      }

      cube.position.x = Math.max(0, Math.min(2, cube.position.x));
      cube.position.z = Math.max(0, Math.min(2, cube.position.z));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fixedPositions, isChatFocused]);

  // Three.js 초기화
  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      35,
      (window.innerWidth * 0.75) / (window.innerHeight * 0.72), // 수정된 비율
      0.1,
      1000,
    );
    camera.position.set(5, 5, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth * 0.75, window.innerHeight * 0.72); // 크기 조정
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;

    // CSS2DRenderer 초기화
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth * 0.75, window.innerHeight * 0.72);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
      mountRef.current.appendChild(labelRenderer.domElement);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(1, 1, 1);
    controls.update();
    controlsRef.current = controls;

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 격자 공간 생성
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
    });
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const edges = new THREE.EdgesGeometry(geometry);
          const gridCube = new THREE.LineSegments(edges, gridMaterial);
          gridCube.position.set(i, j, k);
          scene.add(gridCube);
        }
      }
    }

    // 이동 가능한 큐브 생성
    const movableCubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.5,
    });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const movableCube = new THREE.Mesh(geometry, movableCubeMaterial);
    movableCube.position.set(1, 1, 0);
    movableCube.castShadow = true;
    scene.add(movableCube);
    cubeRef.current = movableCube;

    // 라벨 생성 및 추가
    const createLabel = (text, position) => {
      const div = document.createElement('div');
      div.className = 'label';
      div.textContent = text;
      div.style.marginTop = '-1em';
      const label = new CSS2DObject(div);
      label.position.set(position.x, position.y, position.z);
      scene.add(label);
      return label;
    };

    createLabel('정면', new THREE.Vector3(1, 1, 3)); // 정면 라벨
    createLabel('옆면', new THREE.Vector3(3, 1, 1)); // 옆면 라벨
    createLabel('윗면', new THREE.Vector3(1, 2, 1)); // 윗면 라벨

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera); // 라벨 렌더링 추가
    };
    animate();

    return () => {
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement) {
          renderer.domElement.remove();
        }
      }
      // labelRenderer.dispose() 제거
      if (labelRenderer && labelRenderer.domElement) {
        labelRenderer.domElement.remove();
      }
    };
  }, []);

  // 시점 초기화 함수
  const handleResetView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      camera.position.set(5, 5, 10);
      controls.target.set(1, 1, 1);
      controls.update();
    }
  };

  // 큐브 초기화 함수
  const handleResetCube = () => {
    const scene = sceneRef.current;
    if (scene) {
      const fixedCubes = scene.children.filter((child) => child.userData.fixed);
      fixedCubes.forEach((cube) => scene.remove(cube));
    }
    setFixedPositions([]);
    setUserProgress((prev) => Object.fromEntries(Object.keys(prev).map((userId) => [userId, 0])));
  };
  // 게임 포기 함수
  const handleGiveUp = () => {
    console.log('roome name', roomName);
    socket.emit('leaveGameRoom', {
      roomId: roomId,
      roomName: roomName,
      userId: currentUserId,
      opt: 0,
    });
    sessionStorage.removeItem('isReloaded');
    navigate('/');
  };

  // 위치 스위칭 토글 함수
  const toggleSwitch = () => {
    setIsSwitched((prev) => !prev);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-row">
      {showModal && (
        <RoundModal
          round={currentRound}
          onClose={() => setShowModal(false)} // 모달 닫기
        />
      )}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 border rounded-lg shadow-lg bg-darkblue border-neonblue">
            <h2 className="text-xl font-bold">Round {currentRound}</h2>
            <h2 className="font-bold">축하합니다! 모든 큐브를 맞추셨습니다.</h2>
          </div>
        </div>
      )}
      {/* {errorMessage && (
        <div className="fixed z-50 px-4 py-2 text-white transform -translate-x-1/2 bg-red-500 rounded-lg shadow-lg top-4 left-1/2">
          <p>{errorMessage}</p>
        </div>
      )} */}
      <div
        className={`flex flex-col justify-between w-1/4 px-4 mt-10 mb-[100px] ${isSwitched ? 'order-3 items-end' : 'order-1 items-start'}`} // 순서 스위칭
      >
        <h1 className="text-2xl font-bold">Round {currentRound}</h1>
        <div className="flex flex-col justify-center space-y-4">
          {roomPlayers
            .filter((player) => player.id !== currentUserId) // 본인 제외
            .map((player) => {
              const progress = userProgress[player.id] || 0;
              const isComplete = progress === 100;

              return (
                <div key={player.id} className="flex flex-col">
                  <h4 className="px-2 mb-2">{player.id}의 진행도</h4>
                  <div className="flex w-[240px] h-4 bg-transparentdarkblue rounded-2xl border-neonblue border-2 items-center">
                    <div
                      className={`h-1 px-2 mx-1 ${
                        isComplete ? 'bg-green-500 rounded-xl' : 'bg-neonblue rounded-l-xl'
                      } text-darkblue`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
        {renderChat()}
      </div>

      <div className="flex flex-col order-2 w-2/4 h-screen">
        <div className="flex justify-end">
          <div className="flex px-10 pt-10 space-x-4">
            {/* 스위칭 버튼 */}
            <button onClick={toggleSwitch} className="flex items-center justify-center px-2 py-2 rounded-full ">
              <SwitchIcon className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                handleResetView();
                e.target.blur();
              }}
              className="px-4 py-2 border rounded bg-transparentdarkblue text-neonblue border-neonblue"
            >
              시점 초기화
            </button>
            <button
              onClick={(e) => {
                handleGiveUp();
                e.target.blur();
              }}
              className="px-4 py-2 border rounded bg-transparentdarkblue text-neonblue border-neonblue"
            >
              게임 포기
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <div ref={mountRef} className="h-[72%]" />
        </div>
        <div className="flex items-end justify-end w-full px-10">
          <h3 className="text-2xl font-bold text-center">남은 시간: {formatTime(timeLeft)}</h3>
        </div>
      </div>
      <div
        className={`flex flex-col w-1/4 p-4 mt-10 mb-[100px] border-neonblue space-y-14 items-center justify-center ${
          isSwitched ? 'order-1 border-r' : 'order-3 border-l'
        }`} // 순서 스위칭
      >
        <div className="flex flex-col items-center">
          <h4 className="mb-2 text-xl">정면</h4>
          {frontView.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  className={`w-10 h-10 border border-neonblue ${cell ? 'bg-neonblue' : 'bg-transparentdarkblue'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center">
          <h4 className="mb-2 text-xl">옆면</h4>
          {sideView.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  className={`w-10 h-10 border border-neonblue ${cell ? 'bg-neonblue' : 'bg-transparentdarkblue'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center">
          <h4 className="mb-2 text-xl">윗면</h4>
          {topView.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  className={`w-10 h-10 border border-neonblue ${cell ? 'bg-neonblue' : 'bg-transparentdarkblue'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MultiGamePlay;
