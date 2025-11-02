
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 w-full">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-3">
          <img src="https://picsum.photos/40/40" alt="Logo" className="h-10 w-10 rounded-full" />
          <h1 className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-500">
            Tư vấn tuyển sinh Đại học Hoa Sen
          </h1>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Trợ lý AI sẵn sàng trả lời mọi thắc mắc của bạn về tuyển sinh.
        </p>
      </div>
    </header>
  );
};
