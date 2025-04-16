// ChatMemoryUI.jsx - 優化版聊天介面
import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { Upload, Send } from "lucide-react";

function ChatMemoryUI() {
  const [project, setProject] = useState("預設專案");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    const images = Array.from(items)
      .filter((item) => item.type.startsWith("image"))
      .map((item) => item.getAsFile());
    setFiles((prev) => [...prev, ...images]);
  };

  const handleSubmit = async () => {
    if (!input.trim() && files.length === 0) return;

    const newMsg = {
      text: input,
      time: moment().format("HH:mm:ss"),
      files,
      project,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setFiles([]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto flex flex-col gap-2"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
    >
      <h1 className="text-xl font-bold flex items-center gap-2">
        🧠 記憶聊天小G <span className="text-sm text-gray-400">- {project}</span>
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['全部', '錯誤截圖', '設計草圖', '筆記記錄', '功能任務', '未分類圖片'].map((tag) => (
          <button
            key={tag}
            className="bg-white rounded-xl shadow-sm px-3 py-1 whitespace-nowrap text-sm"
          >
            {tag === '錯誤截圖' && '🐞'}
            {tag === '設計草圖' && '🎨'}
            {tag === '筆記記錄' && '📝'}
            {tag === '功能任務' && '📌'}
            {tag === '未分類圖片' && '📁'} {tag}
          </button>
        ))}

        <input
          placeholder="🔍 搜尋內容..."
          className="border rounded px-2 py-1 text-sm"
        />

        <button className="bg-white rounded-xl shadow-sm px-3 py-1 text-sm">📄 匯出筆記</button>
      </div>

      <div className="flex flex-col gap-1">
        {messages.map((msg, idx) => (
          <div key={idx} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-xs text-gray-400 mb-1">{msg.time}</div>
            <div className="whitespace-pre-wrap text-sm">{msg.text}</div>
            {msg.files?.length > 0 && (
              <div className="flex gap-2 mt-2">
                {msg.files.map((file, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-24 h-24 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {files.length > 0 && (
        <div className="flex gap-2 mt-4">
          {files.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-20 h-20 object-cover rounded"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute top-0 right-0 text-xs bg-black text-white rounded-full px-1"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <input
          className="border rounded p-2 flex-1"
          placeholder="輸入訊息或貼上圖片..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-1"
        >
          <Send size={16} />
          送出
        </button>
      </div>
    </div>
  );
}

export default ChatMemoryUI;
