const fs = require("fs");
const csv = require("csv-parser");

const datasetPath = "./data_sets/customer_support.csv";

let count = 0;

fs.createReadStream(datasetPath)
  .pipe(csv())
  .on("data", (row) => {
    count++;
  })
  .on("end", () => {
    console.log("Dataset successfully loaded!");
    console.log("Total records:", count);
  })
  .on("error", (error) => {
    console.error("Dataset loading failed:", error.message);
  });