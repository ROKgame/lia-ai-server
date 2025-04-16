// routes/featureRoutes.js（功能記憶管理 API）

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ 功能 Schema
const featureSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Feature = mongoose.model("Feature", featureSchema);

// ✅ 新增功能記憶
router.post("/add", async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const exists = await Feature.findOne({ name });
    if (exists) return res.status(400).json({ message: "功能已存在" });
    const feature = new Feature({ name, description, category });
    await feature.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ 新增功能錯誤：", err);
    res.status(500).json({ success: false });
  }
});

// ✅ 取得所有功能清單
router.get("/list", async (req, res) => {
  try {
    const features = await Feature.find().sort({ createdAt: -1 });
    res.status(200).json(features);
  } catch (err) {
    console.error("❌ 查詢功能失敗：", err);
    res.status(500).json({ success: false });
  }
});

// ✅ 更新功能狀態（完成 / 未完成）
router.patch("/toggle", async (req, res) => {
  try {
    const { name, completed } = req.body;
    await Feature.updateOne({ name }, { completed });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ 狀態更新錯誤：", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
