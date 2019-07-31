const Web3 = require("web3");
const fs = require("fs");
const os = require("os");

const cluster = require("cluster");
const numCPUs = os.cpus().length;

const web3 = new Web3();
const pattern = /0x(ba1dbeef|deadbeef|foodbeef|beefbabe|c0ldbeef|foodbabe|beefdead|(0{6,}|1{6,}|2{6,}|3{6,}|4{6,}|5{6,}|6{6,}|7{6,}|8{6,}|9{6,}|a{6,}|b{6,}|c{6,}|d{6,}|e{6,}|f{6,})).*/gi;

const gen = () => {
  let n = 0;
  while (true) {
    n++;

    if (n % 100 === 0) {
      process.send({
        type: "report_n",
        payload: n
      });
    }

    // Create account
    const acc = web3.eth.accounts.create();

    // Match against pattern
    if (acc.address.match(pattern)) {
      process.send({
        type: "found_address",
        payload: `${acc.address},${acc.privateKey}`
      });
    }
  }
};

let workerData = [];
let totalFound = 0;
let sessionStart = new Date().getTime();

const updateMasterDisplay = () => {
  console.log("\033[2J");
  console.log("ethvanity v1.0.0\n");

  let totalN = 0;
  let avgSpeed = 0;

  for (const id in cluster.workers) {
    totalN += workerData[id].lastN;
    avgSpeed += workerData[id].lastSpeed;
  }
  avgSpeed /= workerData.length;
  avgSpeed = Math.floor(avgSpeed);

  console.log(
    `Searched ${totalN} addresses with ${workerData.length} threads at ${avgSpeed} addr/sec.`
  );
  console.log(`${totalFound} matching addresses found so far.`);
};

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    let worker = cluster.fork();
    workerData[worker.id] = {
      lastN: 0,
      lastNTime: new Date().getTime(),
      lastSpeed: 0
    };
  }

  cluster.on("message", (worker, message, handle) => {
    if (message.type === "found_address") {
      fs.appendFileSync("keys.csv", `${message.payload}\n`);
      totalFound++;
      updateMasterDisplay();
    } else if (message.type === "report_n") {
      const now = new Date().getTime();
      const deltaN = message.payload - workerData[worker.id].lastN;
      const deltaTime = now - workerData[worker.id].lastNTime;
      workerData[worker.id].lastSpeed = (deltaN / deltaTime) * 1000;
      workerData[worker.id].lastN = message.payload;
      workerData[worker.id].lastNTime = now;

      // Update display
      updateMasterDisplay();
    }
  });
} else {
  gen();
}

process.on("SIGINT", () => {
  if (cluster.isMaster) {
    console.log("\nSIGINT detected\nTerminating processes...\n");
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  } else {
    process.send({
      type: "death",
      payload: null
    });
    process.exit();
  }
});
