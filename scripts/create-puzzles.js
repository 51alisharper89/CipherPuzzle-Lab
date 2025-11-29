const hre = require("hardhat");

// New contract address
const CONTRACT_ADDRESS = "0x628507832e285D1558112Ad7E48FC92551E89b1F";

const puzzles = [
  {
    id: 1,
    title: "The Genesis Block",
    description: "In the beginning, there was a hash. Find the year when Bitcoin's genesis block was created.",
    reward: "0.01"
  },
  {
    id: 2,
    title: "Binary Sequence",
    description: "Complete the sequence: 1, 2, 4, 8, 16, 32, ?",
    reward: "0.008"
  },
  {
    id: 3,
    title: "Fibonacci Mystery",
    description: "Find the 10th number in the Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, ?",
    reward: "0.012"
  },
  {
    id: 4,
    title: "Prime Quest",
    description: "What is the 15th prime number? (2, 3, 5, 7, 11, ...)",
    reward: "0.015"
  },
  {
    id: 5,
    title: "Ethereum Foundation",
    description: "In what year was the Ethereum mainnet launched?",
    reward: "0.01"
  },
  {
    id: 6,
    title: "Cryptographic Hash",
    description: "How many bits are in a SHA-256 hash output?",
    reward: "0.02"
  },
  {
    id: 7,
    title: "Block Reward Halving",
    description: "How many Bitcoin halving events had occurred by the end of 2024?",
    reward: "0.018"
  },
  {
    id: 8,
    title: "Hexadecimal Challenge",
    description: "Convert 0xFF to decimal",
    reward: "0.008"
  },
  {
    id: 9,
    title: "Gas Limit Mystery",
    description: "What was the initial Ethereum block gas limit? (Answer in millions, e.g., 5 for 5 million)",
    reward: "0.025"
  },
  {
    id: 10,
    title: "Merkle Tree Depth",
    description: "A Merkle tree with 1024 leaf nodes has how many levels? (including root)",
    reward: "0.022"
  },
  {
    id: 11,
    title: "Zama FHE",
    description: "Zama's TFHE library enables computation on encrypted data. What year was Zama founded?",
    reward: "0.03"
  }
];

async function main() {
  console.log("🎯 Creating puzzles on EnigmaVault...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const contract = await hre.ethers.getContractAt("EnigmaVault", CONTRACT_ADDRESS);

  // Check owner
  try {
    const owner = await contract.owner();
    console.log("📋 Contract owner:", owner);
    console.log("📋 Deployer address:", deployer.address);
    console.log("✅ Owner match:", owner.toLowerCase() === deployer.address.toLowerCase());
    console.log("");
  } catch (error) {
    console.log("⚠️  Could not check owner:", error.message, "\n");
  }

  let successCount = 0;
  let failCount = 0;
  let totalReward = 0;

  for (const puzzle of puzzles) {
    try {
      // Check if puzzle already exists
      const existingPuzzle = await contract.getPuzzle(puzzle.id);
      if (existingPuzzle.creator !== "0x0000000000000000000000000000000000000000") {
        console.log(`⏭️  Puzzle #${puzzle.id} already exists, skipping...`);
        continue;
      }
    } catch (e) {
      // Puzzle doesn't exist, proceed
    }

    try {
      console.log(`⏳ Creating Puzzle #${puzzle.id}: ${puzzle.title}`);
      console.log(`   💰 Reward: ${puzzle.reward} ETH`);

      const tx = await contract.createPuzzle(
        puzzle.id,
        puzzle.title,
        puzzle.description,
        {
          value: hre.ethers.parseEther(puzzle.reward),
          gasLimit: 500000
        }
      );

      console.log(`   ⏳ Waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`   ✅ Success! Gas: ${receipt.gasUsed.toString()}`);
      console.log(`   📋 Tx: https://sepolia.etherscan.io/tx/${tx.hash}\n`);

      successCount++;
      totalReward += parseFloat(puzzle.reward);

      // Wait 2 seconds to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      failCount++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`🎉 Puzzle creation complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`💰 Total rewards deposited: ${totalReward.toFixed(4)} ETH`);
  console.log(`📊 Total puzzles: ${puzzles.length}`);
  console.log(`${"=".repeat(50)}`);

  // Verify total puzzles
  try {
    const total = await contract.totalPuzzles();
    console.log(`\n📊 Contract totalPuzzles: ${total.toString()}`);
  } catch (e) {
    console.log("Could not verify total puzzles");
  }
}

main().catch((error) => {
  console.error("❌ Critical error:", error);
  process.exitCode = 1;
});
