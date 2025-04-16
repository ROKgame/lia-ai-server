// routes/messageRoutes.js

const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// ✅ 儲存訊息至 MongoDB
router.post("/save-message", async (req, res) => {
  try {
    const { role, content, image, category, project, createdAt } = req.body;
    const newMessage = new Message({ role, content, image, category, project, createdAt });
    await newMessage.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ 儲存訊息錯誤：", err);
    res.status(500).json({ success: false, error: "伺服器錯誤" });
  }
});

// ✅ 查詢指定專案的訊息
router.get("/messages", async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) return res.status(400).json({ success: false, error: "缺少 project 參數" });
    const messages = await Message.find({ project }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ 查詢訊息失敗：", err);
    res.status(500).json({ success: false, error: "查詢錯誤" });
  }
});

// ✅ 取得所有已存在的專案清單（可用來做下拉選單）
router.get("/projects", async (req, res) => {
  try {
    const projects = await Message.distinct("project");
    res.status(200).json(projects);
  } catch (err) {
    console.error("❌ 查詢專案失敗：", err);
    res.status(500).json({ success: false, error: "無法取得專案" });
  }
});

// ✅ 預設載入某個專案的歷史訊息
router.get("/messages/default", async (req, res) => {
  try {
    const defaultProject = req.query.project || "預設專案";
    const messages = await Message.find({ project: defaultProject }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ 載入預設專案失敗：", err);
    res.status(500).json({ success: false, error: "預設載入錯誤" });
  }
});

module.exports = router;
