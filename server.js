// ✅ server.js：整合 LINE Webhook + GPT 聊天 + 記憶系統 + MongoDB 路由
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const OpenAI = require("openai");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const soul = fs.readFileSync("./lia_soul_profile_v1.txt", "utf8");

// ✅ 中介層
app.use(cors());
app.use((req, res, next) => {
  if (req.path === "/line") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// ✅ LINE Webhook 路由
app.post("/line", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-line-signature"];
    const bodyBuffer = req.body;

    if (!Buffer.isBuffer(bodyBuffer)) {
      console.error("❌ Invalid body: not a buffer");
      return res.status(400).send("Invalid body");
    }

    const hash = crypto.createHmac("sha256", process.env.LINE_CHANNEL_SECRET)
      .update(bodyBuffer)
      .digest("base64");

    if (hash !== signature) {
      console.error("❌ 簽名驗證失敗");
      return res.status(403).send("Invalid signature");
    }

    const body = JSON.parse(bodyBuffer.toString());
    if (!body.events || body.events.length === 0) return res.status(200).send("No events");

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    for (const event of body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const prompt = event.message.text;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
          });

          const replyText = response.choices[0].message.content;
          await axios.post("https://api.line.me/v2/bot/message/reply", {
            replyToken: event.replyToken,
            messages: [{ type: "text", text: replyText }],
          }, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (err) {
          console.error("❌ 回覆錯誤：", err);
          await axios.post("https://api.line.me/v2/bot/message/reply", {
            replyToken: event.replyToken,
            messages: [{ type: "text", text: "⚠️ 無法取得回覆，請稍後再試" }],
          }, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook 錯誤：", err);
    res.status(500).send("Internal Server Error");
  }
});

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
