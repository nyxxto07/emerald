
import fs from "node:fs";

const data = JSON.parse(
  fs.readFileSync("./data_sets/customer_support_clean.json", "utf8")
);

const grouped = {};

for (const item of data) {
  if (!grouped[item.intent]) {
    grouped[item.intent] = [];
  }

  grouped[item.intent].push(item);
}


function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20261126);


const trainData = [];
const testData = [];

for (const intent of Object.keys(grouped)) {
  const examples = grouped[intent];

  // Her intent'in örneklerini karıştır
  for (let i = examples.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [examples[i], examples[j]] = [examples[j], examples[i]];
  }

  const splitIndex = Math.floor(examples.length * 0.8);

  trainData.push(...examples.slice(0, splitIndex));
  testData.push(...examples.slice(splitIndex));
}

fs.writeFileSync(
  "./data_sets/train.json",
  JSON.stringify(trainData, null, 2),
  "utf8"
);

fs.writeFileSync(
  "./data_sets/test.json",
  JSON.stringify(testData, null, 2),
  "utf8"
);

console.log("Dataset split complete!");
console.log("Train records:", trainData.length);
console.log("Test records:", testData.length);
