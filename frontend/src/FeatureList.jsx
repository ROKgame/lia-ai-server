// FeatureList.jsx - 功能記憶系統（連線 MongoDB）
import React, { useEffect, useState } from "react";

export default function FeatureList() {
  const [features, setFeatures] = useState([]);

  const fetchFeatures = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/feature/list");
      const data = await res.json();
      setFeatures(data);
    } catch (err) {
      console.error("❌ 載入功能失敗：", err);
    }
  };

  const toggleComplete = async (name, current) => {
    try {
      await fetch("http://localhost:3001/api/feature/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, completed: !current }),
      });
      fetchFeatures();
    } catch (err) {
      console.error("❌ 更新功能狀態失敗：", err);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  return (
    <div className="max-w-3xl mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">📋 功能記憶清單</h2>
      {features.map((f, idx) => (
        <div
          key={idx}
          className={`border p-3 mb-2 rounded flex justify-between items-center ${f.completed ? "bg-green-50" : "bg-red-50"}`}
        >
          <div>
            <p className="text-sm font-semibold">🔧 {f.name}</p>
            <p className="text-xs text-gray-600">{f.description}</p>
            <p className="text-xs text-gray-400">分類：{f.category}｜建立於 {new Date(f.createdAt).toLocaleString()}</p>
          </div>
          <button
            onClick={() => toggleComplete(f.name, f.completed)}
            className={`text-xs px-3 py-1 rounded ${f.completed ? "bg-gray-400 hover:bg-gray-500 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            {f.completed ? "標記未完成" : "標記已完成"}
          </button>
        </div>
      ))}
    </div>
  );
}
