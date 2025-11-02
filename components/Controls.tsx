
import React from 'react';
import { ConversationState } from '../types';

interface ControlsProps {
  state: ConversationState;
  onStart: () => void;
  onStop: () => void;
}

const StatusIndicator: React.FC<{ state: ConversationState }> = ({ state }) => {
  let color = 'bg-gray-400';
  let text = 'Sẵn sàng';
  let pulse = false;

  switch (state) {
    case ConversationState.CONNECTING:
      color = 'bg-yellow-500';
      text = 'Đang kết nối...';
      pulse = true;
      break;
    case ConversationState.ACTIVE:
      color = 'bg-green-500';
      text = 'Đang lắng nghe...';
      pulse = true;
      break;
    case ConversationState.ERROR:
      color = 'bg-red-500';
      text = 'Lỗi';
      break;
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`}></div>
      <span className="text-sm text-gray-600 dark:text-gray-300">{text}</span>
    </div>
  );
};

export const Controls: React.FC<ControlsProps> = ({ state, onStart, onStop }) => {
  const isIdle = state === ConversationState.IDLE || state === ConversationState.ERROR;
  const isConnecting = state === ConversationState.CONNECTING;

  const handleButtonClick = () => {
    if (isIdle) {
      onStart();
    } else {
      onStop();
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-800 shadow-t-md p-4 w-full border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <StatusIndicator state={state} />
        <button
          onClick={handleButtonClick}
          disabled={isConnecting}
          className={`px-6 py-3 rounded-full font-semibold text-white transition-all duration-200 ease-in-out flex items-center space-x-2 focus:outline-none focus:ring-4
            ${isConnecting ? 'bg-gray-400 cursor-not-allowed' : ''}
            ${isIdle ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300' : ''}
            ${state === ConversationState.ACTIVE ? 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-300' : ''}`}
        >
          {isConnecting ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : isIdle ? (
            <i className="fas fa-microphone-alt"></i>
          ) : (
            <i className="fas fa-stop"></i>
          )}
          <span>
            {isConnecting ? 'Đang kết nối' : isIdle ? 'Bắt đầu hội thoại' : 'Kết thúc hội thoại'}
          </span>
        </button>
      </div>
    </footer>
  );
};
