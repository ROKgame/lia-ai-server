const fs = require('fs');
const readline = require('readline');
const OpenAI = require('openai');
const categorize = require('./categorize');

const openai = new OpenAI({
  apiKey: 'sk-proj-你的APIKEY'
});

const memoryPath = './memory.json';

function loadMemory() {
  if (!fs.existsSync(memoryPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveMemory(type, content) {
  const memory = loadMemory();
  const newItem = {
    type,
    content,
    timestamp: new Date().toISOString()
  };
  memory.push(newItem);
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}

function getMemoryByType(type) {
  const memory = loadMemory();
  return memory
    .filter(m => m.type === type)
    .map((m, i) => `(${i + 1}) ${m.content}`)
    .join('\n');
}

function detectMemoryType(input) {
  if (/任務|進度/.test(input)) return 'task_update';
  if (/bug|錯誤|修正/.test(input)) return 'bug_fix';
  if (/專案|功能|做了什麼/.test(input)) return 'project_content';
  return 'all';
}

// 🔥 新功能：根據輸入判斷是否要刪除記憶
function detectDeleteCommand(input) {
  const lower = input.toLowerCase();
  if (/刪除全部記憶/.test(lower)) return { type: 'all' };
  if (/刪除.*任務/.test(lower)) return { type: 'task_update', keyword: extractKeyword(input) };
  if (/刪除.*bug|錯誤/.test(lower)) return { type: 'bug_fix', keyword: extractKeyword(input) };
  if (/刪除.*專案|功能/.test(lower)) return { type: 'project_content', keyword: extractKeyword(input) };
  if (/刪除.*(含有|包含).+/.test(lower)) return { type: null, keyword: extractKeyword(input) };
  return null;
}

function extractKeyword(input) {
  const match = input.match(/["「](.+?)["」]/) || input.match(/包含(.+?)的/);
  return match ? match[1].trim() : null;
}

function deleteMemory({ type, keyword }) {
  let memory = loadMemory();

  if (type && keyword) {
    memory = memory.filter(m => !(m.type === type && m.content.includes(keyword)));
    console.log(`🧹 已刪除所有 ${type} 中含有「${keyword}」的記憶`);
  } else if (type && type !== 'all') {
    memory = memory.filter(m => m.type !== type);
    console.log(`🧹 已刪除所有 ${type} 的記憶`);
  } else if (keyword) {
    memory = memory.filter(m => !m.content.includes(keyword));
    console.log(`🧹 已刪除所有包含「${keyword}」的記憶`);
  } else if (type === 'all') {
    memory = [];
    console.log('💥 所有記憶已清空！');
  }

  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
}

async function chatWithGPT(userInput) {
  const deleteCommand = detectDeleteCommand(userInput);

  if (deleteCommand) {
    deleteMemory(deleteCommand);
    return;
  }

  const detectedType = detectMemoryType(userInput);
  const memory = loadMemory().filter(m => m.type !== 'casual_chat');
  let memoryText = '';

  if (detectedType === 'all') {
    memoryText = memory.map((m, i) => `(${i + 1}) [${m.type}] ${m.content}`).join('\n');
  } else {
    memoryText = getMemoryByType(detectedType);
  }

  const messages = [
    { role: "system", content: "你是一個記憶助理 AI，會根據記憶回答問題。" },
    { role: "user", content: `記憶內容（${detectedType}）：\n${memoryText}\n\n我現在說的是：${userInput}` }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages
    });

    const reply = completion.choices[0].message.content;
    console.log("\n🤖 AI 回答：\n" + reply);

    saveMemory(categorize(userInput), userInput);
    saveMemory('gpt_reply', reply);
  } catch (error) {
    console.error("❌ GPT 回覆錯誤：", error.response?.data || error.message);
  }
}

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
