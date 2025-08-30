const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  originalUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

const Url = mongoose.model("Url", urlSchema);
module.exports = Url;
