// gptClient.js

require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const OpenAI = require('openai');

// ✅ 從 .env 檔案讀取金鑰
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 讀取記憶檔
function loadProjectMemory() {
  if (!fs.existsSync('./memory.json')) return '';
  const data = fs.readFileSync('./memory.json', 'utf8');
  const memory = JSON.parse(data);
  const filtered = memory.filter(m => m.type !== 'casual_chat');
  return filtered.map((m, i) => `(${i + 1}) [${m.type}] ${m.content}`).join('\n');
}

// 問 GPT
async function askGPT(userInput) {
  const memoryContext = loadProjectMemory();

  const messages = [
    {
      role: "system",
      content: "你是一個AI專案助理，請根據使用者的記憶資料回答問題。"
    },
    {
      role: "user",
      content: `這是我的歷史記憶：\n${memoryContext}\n\n以下是我想問的內容：${userInput}`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages
    });

    console.log("\n🤖 AI 回答：\n" + completion.choices[0].message.content);
  } catch (error) {
    console.error("❌ 錯誤：", error.response?.data || error.message);
  }
}

// 輸入對話
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("💬 請輸入你要問AI的問題：", (input) => {
  askGPT(input);
  rl.close();
});
