import React from 'react';

function RoundModal({ round }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="flex flex-col items-center justify-center w-1/2 mb-10 h-1/2"
        style={{
          backgroundImage: `url(/assets/panel-round.svg)`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="p-8 text-center">
          <h2 className="mb-4 text-[64px] font-bold text-neonblue">Round {round} 시작!</h2>
          <p className="text-lg text-white">3초 후 시작합니다...</p>
        </div>
      </div>
    </div>
  );
}

export default RoundModal;
