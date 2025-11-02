
import React from 'react';
import { useHoaSenAI } from './hooks/useHoaSenAI';
import { Header } from './components/Header';
import { Transcript } from './components/Transcript';
import { Controls } from './components/Controls';
import { ConversationState } from './types';

const App: React.FC = () => {
  const { conversationState, transcript, error, startConversation, stopConversation } = useHoaSenAI();

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header />

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-auto w-full max-w-4xl mt-2" role="alert">
          <p className="font-bold">Lỗi</p>
          <p>{error}</p>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <Transcript transcript={transcript} />
      </main>
      
      <Controls 
        state={conversationState}
        onStart={startConversation}
        onStop={stopConversation}
      />
    </div>
  );
};

export default App;
