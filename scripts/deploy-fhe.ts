import { ethers } from "hardhat";

async function main() {
  console.log("Deploying EnigmaVaultFHE contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy EnigmaVaultFHE
  const EnigmaVaultFHE = await ethers.getContractFactory("EnigmaVaultFHE");
  const contract = await EnigmaVaultFHE.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("EnigmaVaultFHE deployed to:", contractAddress);
  console.log("\nDeployment complete!");
  console.log("\nNext steps:");
  console.log("1. Run create-puzzles-fhe.ts to create puzzles");
  console.log("2. Update frontend contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
