// ✅ 完整的 LINE Webhook 路由邏輯：routes/lineWebhook.js
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const OpenAI = require("openai").default;

const router = express.Router();

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

// ✅ 加入 debug 用的 log
console.log("🔐 Channel Secret:", LINE_CHANNEL_SECRET);
console.log("🔐 Access Token:", LINE_CHANNEL_ACCESS_TOKEN);

// ✅ 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('✅ OpenAI Key:', process.env.OPENAI_API_KEY);

// ✅ 驗證 LINE 簽章是否合法
function validateSignature(bodyBuffer, signature, channelSecret) {
  const hash = crypto.createHmac("sha256", channelSecret)
    .update(bodyBuffer)
    .digest("base64");
  return hash === signature;
}

// ✅ 回覆訊息
async function replyMessage(replyToken, message, channelAccessToken) {
  await axios.post("https://api.line.me/v2/bot/message/reply", {
    replyToken,
    messages: [{ type: "text", text: message }],
  }, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
  });
}

// ✅ LINE Webhook 接收與處理
router.post("/line", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-line-signature"];
    const bodyBuffer = req.body;

    if (!Buffer.isBuffer(bodyBuffer)) {
      console.error("❌ Invalid body: not a buffer");
      return res.status(400).send("Invalid body");
    }

    const isValid = validateSignature(bodyBuffer, signature, LINE_CHANNEL_SECRET);
    if (!isValid) return res.status(403).send("Invalid signature");

    const body = JSON.parse(bodyBuffer.toString());
    if (!body.events || body.events.length === 0) return res.status(200).send("No events");

    const token = LINE_CHANNEL_ACCESS_TOKEN;

    for (const event of body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const prompt = event.message.text;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
          });

          const replyText = response.choices[0].message.content;
          await replyMessage(event.replyToken, replyText, token);
        } catch (err) {
          console.error("❌ OpenAI 回覆錯誤：", err);
          await replyMessage(event.replyToken, "⚠️ 無法取得回覆，請稍後再試", token);
        }
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook 主體錯誤：", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
