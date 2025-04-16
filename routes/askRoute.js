const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');

// 從環境變數讀取 API 金鑰
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// POST /api/ask
router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt 內容' });
    }

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是個幫助使用者解決問題的 AI 助手。' },
        { role: 'user', content: prompt },
      ],
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI 錯誤:', error.response?.data || error.message);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
});

module.exports = router;
