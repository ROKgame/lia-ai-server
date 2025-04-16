// models/Message.js

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, required: true }, // user 或 assistant
  content: { type: String, required: true },
  image: { type: String, default: null },
  category: { type: String, default: "未分類" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
