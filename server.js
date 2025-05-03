// ✅ server.js：修正重複使用 express.raw 的問題 + 完整功能整合
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const OpenAI = require("openai");
const lineWebhook = require("./routes/lineWebhook");

const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ 載入璃亞人格設定檔
const soul = fs.readFileSync("./lia_soul_profile_v1.txt", "utf8");

// ✅ 中介層
app.use(cors());
app.use(express.json()); // ✅ 給非 LINE API 路由使用

// ✅ LINE webhook 必須使用 raw parser（已在 route 裡指定）
app.use("/line", lineWebhook);

// ✅ 記憶功能
const memoryPath = "./memory.json";
function loadMemory() {
  if (!fs.existsSync(memoryPath)) return [];
  return JSON.parse(fs.readFileSync(memoryPath, "utf8"));
}
function saveMemory(type, content) {
  const memory = loadMemory();
  memory.push({ type, content, timestamp: new Date().toISOString() });
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}
function filterMemoryByType(input, memory) {
  if (/任務|進度/.test(input)) return memory.filter(m => m.type === "task_update");
  if (/bug|錯誤/.test(input)) return memory.filter(m => m.type === "bug_fix");
  if (/功能|專案/.test(input)) return memory.filter(m => m.type === "project_content");
  return memory;
}
function categorize(message) {
  if (/任務|進度/.test(message)) return "task_update";
  if (/bug|錯誤/.test(message)) return "bug_fix";
  if (/功能|專案/.test(message)) return "project_content";
  return "general";
}

// ✅ Chat API
app.post("/api/chat", async (req, res) => {
  const { message, image } = req.body;
  const memory = filterMemoryByType(message, loadMemory());
  const memoryText = memory.map((m, i) => `(${i + 1}) [${m.type}] ${m.content}`).join("\n");

  const messages = [
    { role: "system", content: soul },
    { role: "user", content: `以下是你的記憶資料：\n${memoryText}\n\n接下來是使用者的輸入：` }
  ];

  if (image) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: message || "請幫我看看這張圖片。" },
        { type: "image_url", image_url: { url: image } }
      ]
    });
  } else {
    messages.push({ role: "user", content: message });
  }

  try {
    const completion = await openai.chat.completions.create({ model: "gpt-4o", messages });
    const reply = completion.choices[0].message.content;
    saveMemory(categorize(message), message);
    saveMemory("gpt_reply", reply);
    res.json({ reply });
  } catch (err) {
    console.error("❌ GPT 回覆錯誤：", err.response?.data || err.message || err);
    res.status(500).json({ reply: "⚠️ 無法取得 AI 回覆，請稍後再試。" });
  }
});

// ✅ MongoDB 路由整合
app.use("/api", require("./routes/messageRoutes"));
app.use("/api/feature", require("./routes/featureRoutes"));
app.use("/api/ask", require("./routes/askRoute"));

// ✅ MongoDB 連線
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB 已連線"))
  .catch(err => console.error("❌ MongoDB 連線失敗", err));

// ✅ 測試首頁
app.get("/", (req, res) => {
  res.send("Hello! Lia AI server is running 🚀");
});

// ✅ 啟動服務
app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
