
import fs from "node:fs";
import csv from "csv-parser";

const inputPath = "./data_sets/customer_support.csv";
const outputPath = "./data_sets/customer_support_clean.json";

const cleanData = [];

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    cleanData.push({
      instruction: row.instruction,
      intent: row.intent,
      response: row.response
    });
  })
  .on("end", () => {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(cleanData, null, 2),
      "utf8"
    );

    console.log("Clean dataset created!");
    console.log("Records:", cleanData.length);
  })
  .on("error", (error) => {
    console.error("Dataset processing failed:", error.message);
  });
