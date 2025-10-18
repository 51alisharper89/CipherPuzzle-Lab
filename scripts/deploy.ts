import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting EnigmaVault deployment to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  console.log("⏳ Deploying EnigmaVault contract...");
  const EnigmaVault = await ethers.getContractFactory("EnigmaVault");
  const vault = await EnigmaVault.deploy();

  await vault.waitForDeployment();
  const address = await vault.getAddress();

  console.log("✅ EnigmaVault deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + address);
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Update CIPHER_PUZZLE_LAB_ADDRESS in dapp_web/src/config/contract.ts");
  console.log("2. Copy contract address:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
