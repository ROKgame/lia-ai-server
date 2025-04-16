// deleteMemory.js

const fs = require('fs');
const readline = require('readline');

const memoryPath = './memory.json';

function loadMemory() {
  if (!fs.existsSync(memoryPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveMemory(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
  console.log("✅ 記憶已更新！");
}

function deleteByType(type) {
  const memory = loadMemory();
  const filtered = memory.filter(m => m.type !== type);
  saveMemory(filtered);
}

function deleteByKeyword(keyword) {
  const memory = loadMemory();
  const filtered = memory.filter(m => !m.content.includes(keyword));
  saveMemory(filtered);
}

function deleteAll() {
  saveMemory([]);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("\n🗑️ 記憶刪除工具");
console.log("1. 刪除全部記憶");
console.log("2. 刪除指定類型的記憶（例如 task_update）");
console.log("3. 刪除包含某個關鍵字的記憶（例如『聊天室』）\n");

rl.question("請輸入選項（1/2/3）：", (choice) => {
  if (choice === '1') {
    deleteAll();
    rl.close();
  } else if (choice === '2') {
    rl.question("輸入要刪除的類型（如 task_update）：", (type) => {
      deleteByType(type.trim());
      rl.close();
    });
  } else if (choice === '3') {
    rl.question("輸入要刪除的關鍵字（如：聊天室）：", (keyword) => {
      deleteByKeyword(keyword.trim());
      rl.close();
    });
  } else {
    console.log("❌ 無效選項！");
    rl.close();
  }
});
