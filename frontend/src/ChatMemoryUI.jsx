// ✅ ChatMemoryUI.jsx：完整整合 GPT 聊天 + 任務分類 + 圖片預覽 + 記憶儲存
import { useState } from 'react';
import axios from 'axios';

export default function ChatMemoryUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('其他');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() && images.length === 0) return;

    const userMessage = {
      sender: 'user',
      content: input,
      images,
      category,
      time: new Date().toLocaleTimeString(),
      project: 'Lia 記憶' // 🔧 建議加入這欄，方便未來多專案記憶
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImages([]);
    setIsLoading(true);

    try {
      await axios.post('/api/save-message', userMessage); // 儲存使用者訊息

      const res = await axios.post('/api/chat', { message: input });

      const aiReply = {
        sender: 'lia',
        content: res.data.reply,
        time: new Date().toLocaleTimeString(),
        project: 'Lia 記憶'
      };
      setMessages(prev => [...prev, aiReply]);

      await axios.post('/api/save-message', aiReply); // 儲存 AI 回覆

    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'lia',
        content: '⚠️ 無法取得回覆，請稍後再試',
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imagePreviews = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...imagePreviews]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        const preview = URL.createObjectURL(blob);
        setImages(prev => [...prev, preview]);
      }
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 max-w-2xl mx-auto" onPaste={handlePaste} onDrop={handleImageDrop} onDragOver={e => e.preventDefault()}>
      <div className="h-[400px] overflow-y-auto bg-white rounded-xl shadow-inner p-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className="inline-block bg-gray-100 px-3 py-2 rounded-lg max-w-[80%]">
              <div>{msg.content}</div>
              {msg.images && msg.images.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {msg.images.map((img, j) => (
                    <img key={j} src={img} alt="uploaded" className="w-24 h-24 object-cover rounded" />
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">{msg.time} ｜ {msg.category || '未分類'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 類別選擇按鈕 */}
      <div className="flex gap-2 mb-2 overflow-x-auto">
        {['錯誤截圖', '設計草圖', '程式碼問題', '任務備忘', '其他'].map(tag => (
          <button
            key={tag}
            className={`px-3 py-1 rounded-full text-sm border ${category === tag ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setCategory(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 圖片預覽區塊 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} alt="預覽圖" className="w-full h-24 object-cover rounded" />
              <button onClick={() => handleRemoveImage(i)} className="absolute top-0 right-0 text-white bg-black/50 px-2 rounded-bl">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border px-3 py-2 rounded-lg shadow-sm"
          placeholder="輸入訊息..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          onClick={handleSend}
          disabled={isLoading}
        >
          {isLoading ? '傳送中...' : '傳送'}
        </button>
      </div>
    </div>
  );
}
