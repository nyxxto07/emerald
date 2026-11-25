import fs from "node:fs";
import csv from "csv-parser";

let shown = 0;

let missingFields = 0;
const instructions = {};
const placeholders = new Set();

const datasetPath = "./data_sets/customer_support.csv";

const categories = {};
const intents = {};

let count = 0;

fs.createReadStream(datasetPath)
  .pipe(csv())
  .on("data", (row) => {
    count++;

    if (row.intent === "track_order" && shown < 5) {
      console.log(row);
      shown++;
    }

    // Check missing fields
    if (!row.instruction?.trim() || !row.response?.trim()) {
      missingFields++;
    }

    // Count repeated instructions
    const instruction = row.instruction?.trim();

    if (instruction) {
      instructions[instruction] = (instructions[instruction] || 0) + 1;
    }

    // Find placeholders
    const matches = row.response?.match(/\{\{.*?\}\}/g) || [];

    matches.forEach((placeholder) => {
      placeholders.add(placeholder);
    });

    const { category, intent } = row;

    categories[category] = (categories[category] || 0) + 1;
    intents[intent] = (intents[intent] || 0) + 1;
  })
  .on("end", () => {
    console.log("\n=== DATASET SUMMARY ===");
    console.log("Total records:", count);

    console.log("\n=== CATEGORIES ===");
    console.table(categories);

    console.log("\n=== INTENTS ===");
    console.table(intents);

    const duplicateInstructions = Object.values(instructions)
      .filter((value) => value > 1).length;

    console.log("\n=== DATA QUALITY ===");
    console.log("Missing fields:", missingFields);
    console.log("Repeated instruction groups:", duplicateInstructions);
    console.log("Unique placeholders:", placeholders.size);

    console.log("\n=== PLACEHOLDERS ===");
    console.table([...placeholders]);
  })
  .on("error", (error) => {
    console.error("Dataset loading failed:", error.message);
  });