const hre = require("hardhat");

const puzzles = [
  {
    id: 1,
    title: "The Genesis Block",
    description: "In the beginning, there was a hash. Find the year when Bitcoin's genesis block was created.",
    answer: 2009,
    reward: "0.002"
  },
  {
    id: 2,
    title: "Binary Sequence",
    description: "Complete the sequence: 1, 2, 4, 8, 16, 32, ?",
    answer: 64,
    reward: "0.001"
  },
  {
    id: 3,
    title: "Fibonacci Mystery",
    description: "Find the 10th number in the Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, ?",
    answer: 34,
    reward: "0.0015"
  }
];

async function main() {
  console.log("🎯 Creating puzzles directly without FHE plugin init...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const contractAddress = "0x8eD0904dEf8973F3918fC5Ace4DBe7cEf2461598";
  const EnigmaVault = await hre.ethers.getContractAt("EnigmaVaultFHE", contractAddress);

  // 检查 owner
  try {
    const owner = await EnigmaVault.owner();
    console.log("📋 Contract owner:", owner);
    console.log("📋 Deployer address:", deployer.address);
    console.log("✅ Owner match:", owner.toLowerCase() === deployer.address.toLowerCase());
    console.log("");
  } catch (error) {
    console.log("⚠️  Could not check owner\n");
  }

  let successCount = 0;
  let failCount = 0;

  for (const puzzle of puzzles) {
    try {
      console.log(`⏳ Creating Puzzle #${puzzle.id}: ${puzzle.title}`);
      console.log(`   📊 Answer: ${puzzle.answer}`);

      const tx = await EnigmaVault.createPuzzleTest(
        puzzle.id,
        puzzle.title,
        puzzle.description,
        puzzle.answer,
        {
          value: hre.ethers.parseEther(puzzle.reward),
          gasLimit: 3000000  // 设置足够的 gas
        }
      );

      console.log(`   ⏳ Waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`   ✅ Success! Gas: ${receipt.gasUsed.toString()}, Reward: ${puzzle.reward} ETH`);
      console.log(`   📋 Tx: ${tx.hash}\n`);
      successCount++;

      // 等待2秒避免 nonce 问题
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      console.log("");
      failCount++;
    }
  }

  console.log(`\n🎉 Puzzle creation complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${puzzles.length}`);
}

main().catch((error) => {
  console.error("❌ Critical error:", error);
  process.exitCode = 1;
});
