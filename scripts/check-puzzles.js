const hre = require("hardhat");

async function main() {
  const contractAddress = "0x362826cE7c0d18E9029d1E5F4Bf4C0894eE749f6";
  const EnigmaVaultFHE = await hre.ethers.getContractAt("EnigmaVaultMock", contractAddress);

  console.log("\n🔍 检查链上谜题状态...\n");

  for (let i = 1; i <= 11; i++) {
    try {
      const puzzle = await EnigmaVaultFHE.getPuzzle(i);
      console.log(`谜题 ${i}:`);
      console.log(`  标题: ${puzzle[0]}`);
      console.log(`  奖励: ${hre.ethers.formatEther(puzzle[2])} ETH`);
      console.log(`  是否激活: ${puzzle[4]}`);
      console.log(`  解题人数: ${puzzle[5].toString()}`);
      console.log("");
    } catch (error) {
      console.log(`谜题 ${i}: 不存在或未创建`);
      console.log("");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
