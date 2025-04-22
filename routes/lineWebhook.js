// ✅ 完整的 LINE Webhook 路由邏輯：routes/lineWebhook.js
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
const crypto = require('crypto');

// ✅ 初始化 OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// ✅ 驗證 LINE 簽章是否合法
function validateSignature(body, signature, channelSecret) {
  const hash = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64');
  return hash === signature;
}

// ✅ 回覆訊息
async function replyMessage(replyToken, message, channelAccessToken) {
  await axios.post('https://api.line.me/v2/bot/message/reply', {
    replyToken,
    messages: [{ type: 'text', text: message }],
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${channelAccessToken}`
    }
  });
}

// ✅ LINE Webhook 接收與處理
router.post('/line', express.raw({ type: '*/*' }), async (req, res) => {
  const signature = req.headers['x-line-signature'];
  const body = req.body.toString();
  const isValid = validateSignature(body, signature, process.env.LINE_CHANNEL_SECRET);

  if (!isValid) return res.status(403).send('Invalid signature');

  const events = JSON.parse(body).events;
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const prompt = event.message.text;

      try {
        const response = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });

        const replyText = response.data.choices[0].message.content;
        await replyMessage(event.replyToken, replyText, token);
      } catch (err) {
        await replyMessage(event.replyToken, '⚠️ 無法取得回覆，請稍後再試', token);
      }
    }
  }

  res.status(200).send('OK');
});

module.exports = router;
