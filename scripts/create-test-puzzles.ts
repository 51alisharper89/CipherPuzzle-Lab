import { ethers } from "hardhat";

const puzzles = [
  {
    id: 1,
    title: "The Genesis Block",
    description: "In the beginning, there was a hash. Find the year when Bitcoin's genesis block was created.",
    answer: 2009,  // Bitcoin genesis block year
    reward: "0.002"
  },
  {
    id: 2,
    title: "Binary Sequence",
    description: "Complete the sequence: 1, 2, 4, 8, 16, 32, ?",
    answer: 64,  // Next power of 2
    reward: "0.001"
  },
  {
    id: 3,
    title: "Fibonacci Mystery",
    description: "Find the 10th number in the Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, ?",
    answer: 34,  // 10th Fibonacci number
    reward: "0.0015"
  }
];

async function main() {
  console.log("🎯 Creating FHE test puzzles...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  const contractAddress = "0x8eD0904dEf8973F3918fC5Ace4DBe7cEf2461598";
  const EnigmaVault = await ethers.getContractAt("EnigmaVaultFHE", contractAddress);

  let successCount = 0;
  let failCount = 0;

  for (const puzzle of puzzles) {
    try {
      console.log(`⏳ Creating Puzzle #${puzzle.id}: ${puzzle.title}`);
      console.log(`   📊 Answer (will be FHE encrypted in contract): ${puzzle.answer}`);

      // ✅ 使用 createPuzzleTest - 合约会用 FHE.asEuint32() 加密答案
      const tx = await EnigmaVault.createPuzzleTest(
        puzzle.id,
        puzzle.title,
        puzzle.description,
        puzzle.answer,  // plainAnswer - 合约会自动加密
        { value: ethers.parseEther(puzzle.reward) }
      );

      const receipt = await tx.wait();
      console.log(`   ✅ Success! Gas: ${receipt?.gasUsed.toString()}, Reward: ${puzzle.reward} ETH`);
      console.log(`   📋 Tx: ${tx.hash}`);
      console.log(`   🔐 Answer is now FHE-encrypted on-chain!`);
      successCount++;

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message.split('\n')[0]}`);
      failCount++;
    }
  }

  console.log(`\n🎉 Puzzle creation complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${puzzles.length}`);

  if (successCount > 0) {
    console.log(`\n🔒 All answers are FHE-encrypted on-chain!`);
    console.log(`   Users must submit FHE-encrypted answers to solve them.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Critical error:", error);
    process.exit(1);
  });
