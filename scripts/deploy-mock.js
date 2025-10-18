const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EnigmaVaultMock to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const EnigmaVaultMock = await hre.ethers.getContractFactory("EnigmaVaultMock");
  console.log("⏳ Deploying contract...");

  const contract = await EnigmaVaultMock.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ EnigmaVaultMock deployed to:", address);
  console.log("\n📋 Update frontend config with this address!");
  console.log(`   CIPHER_PUZZLE_LAB_ADDRESS = '${address}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
