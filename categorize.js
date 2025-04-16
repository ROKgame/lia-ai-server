// categorize.js

function categorizeMessage(message) {
    const projectKeywords = ["專案", "角色", "設計", "功能", "系統", "設定", "資料庫"];
    const taskKeywords = ["完成", "未完成", "進度", "下一步", "計畫"];
    const bugKeywords = ["錯誤", "Bug", "修正", "修好", "出錯"];

    const lowerMessage = message.toLowerCase();

    if (projectKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return "project_content";
    } else if (taskKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return "task_update";
    } else if (bugKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return "bug_fix";
    } else {
        return "casual_chat";
    }
}

module.exports = categorizeMessage;
