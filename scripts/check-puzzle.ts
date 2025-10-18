import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking puzzle state...\n");

  const contractAddress = "0xa21b429874eC6D9089858Cc7Bb12afeDd729624B";
  const EnigmaVault = await ethers.getContractAt("EnigmaVault", contractAddress);

  // Check puzzle #1
  const puzzle = await EnigmaVault.getPuzzle(1);
  console.log("📋 Puzzle #1:");
  console.log("  Title:", puzzle[0]);
  console.log("  Description:", puzzle[1]);
  console.log("  Reward:", ethers.formatEther(puzzle[2]), "ETH");
  console.log("  Creator:", puzzle[3]);
  console.log("  Is Active:", puzzle[4]);
  console.log("  Solvers:", puzzle[5].toString());

  // Check total stats
  const totalPuzzles = await EnigmaVault.totalPuzzles();
  const totalSolvers = await EnigmaVault.totalSolvers();
  
  console.log("\n📊 Global Stats:");
  console.log("  Total Puzzles:", totalPuzzles.toString());
  console.log("  Total Solvers:", totalSolvers.toString());

  // Check player points
  const playerAddress = "0x4fe9355E9Af58F585e75958219b86FCcCb8fAaC9";
  const points = await EnigmaVault.getPlayerPoints(playerAddress);
  console.log("\n🎯 Player Points:");
  console.log("  Address:", playerAddress);
  console.log("  Points:", points.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
