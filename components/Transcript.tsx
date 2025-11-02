
import React, { useRef, useEffect } from 'react';
import { TranscriptEntry } from '../types';

interface TranscriptProps {
  transcript: TranscriptEntry[];
}

const UserIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
    <i className="fas fa-user text-white"></i>
  </div>
);

const ModelIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center">
    <i className="fas fa-robot text-white"></i>
  </div>
);

export const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-4xl mx-auto space-y-6">
        {transcript.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 pt-10">
            <i className="fas fa-microphone-alt text-4xl mb-4"></i>
            <p>Nhấn nút "Bắt đầu hội thoại" để hỏi đáp cùng trợ lý AI.</p>
          </div>
        ) : (
          transcript.map((entry, index) => (
            <div
              key={`${entry.id}-${index}`}
              className={`flex items-start gap-3 ${
                entry.speaker === 'user' ? 'justify-end' : ''
              }`}
            >
              {entry.speaker === 'model' && <ModelIcon />}
              <div
                className={`max-w-md lg:max-w-2xl rounded-2xl px-4 py-3 text-sm md:text-base ${
                  entry.speaker === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                }`}
              >
                {entry.text}
              </div>
              {entry.speaker === 'user' && <UserIcon />}
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};
