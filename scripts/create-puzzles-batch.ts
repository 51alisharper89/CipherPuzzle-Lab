import { ethers } from "hardhat";

const puzzles = [
  {
    id: 1,
    title: "The Genesis Block",
    description: "In the beginning, there was a hash. Find the first value that started it all.",
    reward: "0.01"
  },
  {
    id: 2,
    title: "Byzantine Consensus",
    description: "Four generals must agree on an attack time. Can you find the consensus value?",
    reward: "0.015"
  },
  {
    id: 3,
    title: "Hash Collision Mystery",
    description: "Find the value that creates a specific hash pattern in SHA-256.",
    reward: "0.025"
  },
  {
    id: 4,
    title: "Merkle Tree Puzzle",
    description: "Navigate through the Merkle tree to find the hidden value.",
    reward: "0.012"
  },
  {
    id: 5,
    title: "Smart Contract Riddle",
    description: "Decode the smart contract logic to reveal the answer.",
    reward: "0.008"
  },
  {
    id: 6,
    title: "Zero Knowledge Challenge",
    description: "Prove you know the answer without revealing it... until now!",
    reward: "0.03"
  },
  {
    id: 7,
    title: "Cryptographic Sequence",
    description: "Complete the cryptographic sequence with the missing number.",
    reward: "0.01"
  },
  {
    id: 8,
    title: "Digital Signature Puzzle",
    description: "Find the private key value that matches the given signature pattern.",
    reward: "0.018"
  },
  {
    id: 9,
    title: "Blockchain Trilemma",
    description: "Solve the scalability, security, and decentralization equation.",
    reward: "0.022"
  },
  {
    id: 10,
    title: "Consensus Algorithm",
    description: "Determine the optimal consensus value for the distributed network.",
    reward: "0.014"
  },
  {
    id: 11,
    title: "Elliptic Curve Mystery",
    description: "Navigate the elliptic curve to find the secret point.",
    reward: "0.028"
  }
];

async function main() {
  console.log("🎯 Creating batch of test puzzles...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  const contractAddress = "0x2268039A822d2908e1260BC02edD535C9637c621";
  const EnigmaVault = await ethers.getContractAt("EnigmaVault", contractAddress);

  let successCount = 0;
  let failCount = 0;

  for (const puzzle of puzzles) {
    try {
      console.log(`⏳ Creating Puzzle #${puzzle.id}: ${puzzle.title}`);

      const tx = await EnigmaVault.createPuzzle(
        puzzle.id,
        puzzle.title,
        puzzle.description,
        { value: ethers.parseEther(puzzle.reward) }
      );

      const receipt = await tx.wait();
      console.log(`   ✅ Success! Gas: ${receipt?.gasUsed.toString()}, Reward: ${puzzle.reward} ETH`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message.split('\n')[0]}`);
      failCount++;
    }
  }

  console.log(`\n🎉 Batch creation complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${puzzles.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Critical error:", error);
    process.exit(1);
  });
