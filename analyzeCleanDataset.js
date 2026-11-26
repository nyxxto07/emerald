
import fs from "node:fs";

const data = JSON.parse(
  fs.readFileSync("./data_sets/customer_support_clean.json", "utf8")
);

const intentCounts = {};

for (const item of data) {
  intentCounts[item.intent] =
    (intentCounts[item.intent] || 0) + 1;
}

const sortedIntents = Object.entries(intentCounts)
  .sort((a, b) => b[1] - a[1]);

console.log("Unique intents:", sortedIntents.length);
console.log("\nIntent distribution:\n");

for (const [intent, count] of sortedIntents) {
  console.log(`${intent}: ${count}`);
}
