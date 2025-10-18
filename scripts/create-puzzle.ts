import { ethers } from "hardhat";

async function main() {
  console.log("🎯 Creating test puzzle...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const contractAddress = "0xa21b429874eC6D9089858Cc7Bb12afeDd729624B";
  const EnigmaVault = await ethers.getContractAt("EnigmaVault", contractAddress);

  console.log("⏳ Creating puzzle #1: The Genesis Block");

  const tx = await EnigmaVault.createPuzzle(
    1, // puzzleId
    "The Genesis Block",
    "In the beginning, there was a hash. Find the missing value in this cryptographic sequence.",
    { value: ethers.parseEther("0.01") } // 0.01 ETH reward
  );

  console.log("📤 Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Puzzle created! Gas used:", receipt?.gasUsed.toString());

  console.log("\n🎉 Test puzzle ready!");
  console.log("Puzzle ID: 1");
  console.log("Title: The Genesis Block");
  console.log("Reward: 0.01 ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
