import { ethers } from "hardhat";

async function main() {
  console.log("Deploying EnigmaVault V2 with leaderboard support...");

  const EnigmaVault = await ethers.getContractFactory("EnigmaVault");
  const enigmaVault = await EnigmaVault.deploy();

  await enigmaVault.waitForDeployment();

  const address = await enigmaVault.getAddress();
  console.log(`EnigmaVault V2 deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
