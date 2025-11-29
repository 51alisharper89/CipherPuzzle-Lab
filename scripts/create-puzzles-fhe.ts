import { ethers } from "hardhat";

const CONTRACT_ADDRESS = "0x5A03982D1859C5A3f60745358F1b8d6019462C9B";

// Puzzles with encrypted answers (using createPuzzleTest for testing)
const puzzles = [
  {
    id: 1,
    title: "The Genesis Block",
    description: "What year was Bitcoin's genesis block mined?",
    answer: 2009,
    reward: "0.01"
  },
  {
    id: 2,
    title: "Ethereum Block Time",
    description: "What is the approximate target block time in Ethereum (in seconds)?",
    answer: 12,
    reward: "0.012"
  },
  {
    id: 3,
    title: "Cryptographic Hash",
    description: "How many bits are in a SHA-256 hash output?",
    answer: 256,
    reward: "0.015"
  },
  {
    id: 4,
    title: "The Merge Year",
    description: "In what year did Ethereum transition from PoW to PoS (The Merge)?",
    answer: 2022,
    reward: "0.018"
  },
  {
    id: 5,
    title: "Bitcoin Halving",
    description: "How many bitcoins were rewarded per block after the first halving?",
    answer: 25,
    reward: "0.02"
  },
  {
    id: 6,
    title: "Ethereum Supply",
    description: "What is the approximate total supply of ETH (in millions, rounded)?",
    answer: 120,
    reward: "0.022"
  },
  {
    id: 7,
    title: "FHE Key Size",
    description: "What is a common key size for FHE schemes (in bits)?",
    answer: 128,
    reward: "0.025"
  },
  {
    id: 8,
    title: "Zama TFHE",
    description: "TFHE stands for Torus FHE. What dimension is commonly used for the torus?",
    answer: 1,
    reward: "0.028"
  },
  {
    id: 9,
    title: "Private Key Length",
    description: "How many bytes is an Ethereum private key?",
    answer: 32,
    reward: "0.03"
  },
  {
    id: 10,
    title: "Homomorphic Magic",
    description: "In FHE, how many operations can you perform on encrypted data? (1=limited, 2=unlimited)",
    answer: 2,
    reward: "0.015"
  },
  {
    id: 11,
    title: "Blockchain Pioneer",
    description: "Satoshi Nakamoto published the Bitcoin whitepaper in what month of 2008? (1-12)",
    answer: 10,
    reward: "0.02"
  }
];

async function main() {
  console.log("Creating puzzles on EnigmaVaultFHE...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get contract instance
  const contract = await ethers.getContractAt("EnigmaVaultFHE", CONTRACT_ADDRESS);

  let totalReward = 0n;

  for (const puzzle of puzzles) {
    try {
      console.log(`Creating puzzle #${puzzle.id}: ${puzzle.title}`);
      console.log(`  Answer (encrypted on-chain): ${puzzle.answer}`);
      console.log(`  Reward: ${puzzle.reward} ETH`);

      const rewardWei = ethers.parseEther(puzzle.reward);
      totalReward += rewardWei;

      // Use createPuzzleTest which encrypts the answer on-chain
      const tx = await contract.createPuzzleTest(
        puzzle.id,
        puzzle.title,
        puzzle.description,
        puzzle.answer,
        { value: rewardWei }
      );

      await tx.wait();
      console.log(`  ✅ Created! TX: ${tx.hash}\n`);
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total puzzles created: ${puzzles.length}`);
  console.log(`Total rewards deposited: ${ethers.formatEther(totalReward)} ETH`);

  const totalPuzzles = await contract.totalPuzzles();
  console.log(`Contract total puzzles: ${totalPuzzles}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
