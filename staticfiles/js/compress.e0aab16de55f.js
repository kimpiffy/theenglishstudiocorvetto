/* jshint esversion: 6, node: true, devel: true, asi: true */
/* jshint -W030, -W033 */

require("dotenv").config(); // Load .env variables

const fs = require("fs");
const path = require("path");
const tinify = require("tinify");

// Use API key from .env
tinify.key = process.env.TINIFY_API_KEY;

// Set up input/output paths (relative to this script)
const inputDir = path.join(__dirname, "..", "images");
const outputDir = path.join(__dirname, "..", "compressed");

// Ensure output folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process each file
fs.readdirSync(inputDir).forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return;

  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file);

  // Skip if already compressed
  if (fs.existsSync(outputPath)) {
    console.log(`⚠️  Skipping (already exists): ${file}`);
    return;
  }

  // Compress and save
  tinify.fromFile(inputPath).toFile(outputPath)
    .then(() => console.log(`✅ Compressed: ${file}`))
    .catch(err => console.error(`❌ Error with ${file}:`, err.message));
});
