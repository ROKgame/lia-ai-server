// server.js：支援 GPT-4 Vision 圖片輸入 + 記憶儲存 + 功能記憶 API + 璃亞人格注入
require("dotenv").config();
const express = require("express");
const lineWebhook = require("./routes/lineWebhook");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const OpenAI = require("openai");
const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use('/api/line', express.raw({ type: '*/*' }), require('./routes/lineWebhook'));

// ✅ 載入璃亞人格設定檔
const soul = fs.readFileSync("./lia_soul_profile_v1.txt", "utf8");

const memoryPath = "./memory.json";
function loadMemory() {
  if (!fs.existsSync(memoryPath)) return [];
  return JSON.parse(fs.readFileSync(memoryPath, "utf8"));
}

function saveMemory(type, content) {
  const memory = loadMemory();
  const newItem = { type, content, timestamp: new Date().toISOString() };
  memory.push(newItem);
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}

function filterMemoryByType(input, memory) {
  if (/任務|進度/.test(input)) return memory.filter(m => m.type === "task_update");
  if (/bug|錯誤/.test(input)) return memory.filter(m => m.type === "bug_fix");
  if (/功能|專案/.test(input)) return memory.filter(m => m.type === "project_content");
  return memory;
}

app.post("/api/chat", async (req, res) => {
  const { message, image } = req.body;
  const memory = filterMemoryByType(message, loadMemory());
  const memoryText = memory.map((m, i) => `(${i + 1}) [${m.type}] ${m.content}`).join("\n");

  const messages = [
    { role: "system", content: soul }, // 注入璃亞靈魂設定
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages
    });
    const reply = completion.choices[0].message.content;
    saveMemory(categorize(message), message);
    saveMemory("gpt_reply", reply);
    res.json({ reply });
  } catch (err) {
    console.error("❌ GPT 回覆錯誤：", err.response?.data || err.message || err);
    res.status(500).json({ reply: "⚠️ 無法取得 AI 回覆，請稍後再試。" });
  }
});

// ✅ 加入 LINE webhook 路由
app.use("/api/line", express.raw({ type: "*/*" }), lineWebhook);

// ✅ MongoDB 路由整合
app.use("/api", require("./routes/messageRoutes"));
app.use("/api/feature", require("./routes/featureRoutes"));
app.use("/api/ask", require("./routes/askRoute"));

// ✅ MongoDB 連線
mongoose.connect("mongodb+srv://Lia-AI:ailia@ai.nrelirl.mongodb.net/?retryWrites=true&w=majority&appName=AI", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB 已連線"))
  .catch(err => console.error("❌ MongoDB 連線失敗", err));

app.get("/", (req, res) => {
  res.send("Hello! Lia AI server is running 🚀");
});

app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
