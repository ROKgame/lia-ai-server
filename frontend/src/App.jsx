// App.jsx - UI 主畫面：切換 Chat 與 功能查詢
import React, { useState } from "react";
import ChatMemoryUI from "./ChatMemoryUI";
import FeatureList from "./FeatureList";

function App() {
  const [view, setView] = useState("chat");

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-center mb-4 gap-4">
        <button
          onClick={() => setView("chat")}
          className={`px-4 py-2 rounded ${view === "chat" ? "bg-indigo-600 text-white" : "bg-white border"}`}
        >🧠 記憶聊天</button>

        <button
          onClick={() => setView("features")}
          className={`px-4 py-2 rounded ${view === "features" ? "bg-indigo-600 text-white" : "bg-white border"}`}
        >📋 功能清單</button>
      </div>

      {view === "chat" && <ChatMemoryUI />}
      {view === "features" && <FeatureList />}
    </div>
  );
}

export default App;
