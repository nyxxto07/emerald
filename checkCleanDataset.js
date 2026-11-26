
import fs from "node:fs";

const filePath = "./data_sets/customer_support_clean.json";

const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

console.log("Total records:", data.length);
console.log("First record:");
console.log(data[0]);

const invalidRecords = data.filter(
  (item) =>
    !item.instruction ||
    !item.intent ||
    !item.response
);

console.log("Invalid records:", invalidRecords.length);
