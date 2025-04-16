// chatMemory.js（智慧查詢版）

const fs = require('fs');
const readline = require('readline');
const OpenAI = require('openai');
const categorize = require('./categorize');

// ✅ 請填入你的 API 金鑰
const openai = new OpenAI({
  apiKey: 'sk-proj-你的APIKEY'
});

// 載入全部記憶
function loadMemory() {
  if (!fs.existsSync('./memory.json')) return [];
  try {
    return JSON.parse(fs.readFileSync('./memory.json', 'utf8'));
  } catch {
    return [];
  }
}

// 分類查詢記憶（指定類型）
function getMemoryByType(type) {
  const memory = loadMemory();
  return memory
    .filter(m => m.type === type)
    .map((m, i) => `(${i + 1}) ${m.content}`)
    .join('\n');
}

// 判斷使用者問題要載入哪一類記憶
function detectMemoryType(input) {
  if (/任務|進度/.test(input)) return 'task_update';
  if (/bug|錯誤|修正/.test(input)) return 'bug_fix';
  if (/專案|功能|做了什麼/.test(input)) return 'project_content';
  return 'all'; // 預設使用全部重要記憶
}

// 儲存新記憶（對話 + 回覆）
function saveMemory(type, content) {
  const memory = loadMemory();
  const newItem = {
    type,
    content,
    timestamp: new Date().toISOString()
  };
  memory.push(newItem);
  fs.writeFileSync('./memory.json', JSON.stringify(memory, null, 2));
}

// 與 GPT 對話
async function chatWithGPT(userInput) {
  const detectedType = detectMemoryType(userInput);
  const memory = loadMemory();
  const filtered = memory.filter(m => m.type !== 'casual_chat');

  let memoryText = '';
  if (detectedType === 'all') {
    memoryText = filtered.map((m, i) => `(${i + 1}) [${m.type}] ${m.content}`).join('\n');
  } else {
    memoryText = getMemoryByType(detectedType);
  }

  const messages = [
    {
      role: "system",
      content: "你是一位 AI 專案助理，會根據記憶回應使用者。請簡明回答並引用記憶內容。"
    },
    {
      role: "user",
      content: `這是我的記憶資料（${detectedType}）：\n${memoryText}\n\n我現在想說的是：${userInput}`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages
    });

    const reply = completion.choices[0].message.content;
    console.log("\n🤖 AI 回答：\n" + reply);

    // 對話雙方都存
    saveMemory(categorize(userInput), userInput);
    saveMemory('gpt_reply', reply);
  } catch (error) {
    console.error("❌ GPT 回覆錯誤：", error.response?.data || error.message);
  }
}

// 啟動 CLI 聊天
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askLoop() {
  rl.question('\n💬 請輸入你要對 AI 說的話：\n> ', async (input) => {
    await chatWithGPT(input);
    askLoop();
  });
}

askLoop();
``
