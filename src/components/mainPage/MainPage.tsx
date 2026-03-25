import React, { useState } from 'react';

const MainPage = () => {
  const [text, setText] = useState('');

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Главная</h1>
      
      <div className="bg-white rounded-lg p-6 shadow mb-6">
        <p className="text-gray-600 mb-4">Страница в разработке</p>
        
        {/* Инпут для проверки сохранения состояния */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тестовое поле (текст сохраняется при переключении вкладок)
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите что-нибудь..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {text && (
            <p className="mt-2 text-sm text-gray-500">
              Вы ввели: {text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPage;