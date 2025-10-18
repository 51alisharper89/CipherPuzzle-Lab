import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying EnigmaVaultFHE with FHE support...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy FHE contract
  const EnigmaVaultFHE = await ethers.getContractFactory("EnigmaVaultFHE");
  console.log("⏳ Deploying EnigmaVaultFHE...");

  const enigmaVault = await EnigmaVaultFHE.deploy();
  await enigmaVault.waitForDeployment();

  const address = await enigmaVault.getAddress();
  console.log("✅ EnigmaVaultFHE deployed to:", address);
  console.log("\n📋 Next steps:");
  console.log("1. Update dapp_web/src/config/contract.ts with new address");
  console.log("2. Update contract ABI");
  console.log("3. Create puzzles with encrypted answers using FHE SDK");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
