// ✅ 完整的 LINE Webhook 路由邏輯：routes/lineWebhook.js
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const OpenAI = require("openai").default;

const router = express.Router();

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;


// ✅ 加入 debug 用的 log（加在這）
console.log("🔐 Channel Secret:", LINE_CHANNEL_SECRET);
console.log("🔐 Access Token:", LINE_CHANNEL_ACCESS_TOKEN);


// ✅ 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('✅ OpenAI Key:', process.env.OPENAI_API_KEY);


// ✅ 驗證 LINE 簽章是否合法
function validateSignature(body, signature, channelSecret) {
  const hash = crypto.createHmac("sha256", channelSecret)
    .update(JSON.stringify(body))
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
router.post('/', async (req, res) => {
  const body = req.body;

  const signature = req.headers["x-line-signature"];
  const isValid = validateSignature(body, signature, LINE_CHANNEL_SECRET);

  if (!isValid) return res.status(403).send("Invalid signature");

  const events = JSON.parse(body).events;
  const token = LINE_CHANNEL_ACCESS_TOKEN;


  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const prompt = event.message.text;
      try {
        const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        });

        const replyText = response.data.choices[0].message.content;
        await replyMessage(event.replyToken, replyText, token);
      } catch (err) {
        console.error("❌ 發生錯誤：", err); // <<--- 加上這行
        await replyMessage(event.replyToken, "⚠️ 無法取得回覆，請稍後再試", token);
      }
    }
  }

  res.status(200).send("OK");
});

module.exports = router;