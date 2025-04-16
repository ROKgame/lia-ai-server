// saveMemory.js

const fs = require('fs');
const readline = require('readline');
const categorizeMessage = require('./categorize');

function saveMemory(message) {
    const type = categorizeMessage(message);
    const timestamp = new Date().toISOString();

    const memoryItem = {
        type,
        content: message,
        timestamp
    };

    let memoryData = [];

    if (fs.existsSync('./memory.json')) {
        const data = fs.readFileSync('./memory.json', 'utf8');
        try {
            memoryData = JSON.parse(data);
        } catch (e) {
            console.error("❌ JSON格式錯誤，請確認 memory.json 檔案內容正確！");
            return;
        }
    }

    memoryData.push(memoryItem);

    fs.writeFileSync('./memory.json', JSON.stringify(memoryData, null, 2));
    console.log(`✅ 已分類並儲存為 [${type}]`);
}

// 建立輸入介面
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('💬 請輸入對話內容：', (input) => {
    saveMemory(input);
    rl.close();
});
