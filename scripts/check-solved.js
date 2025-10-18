const hre = require("hardhat");

async function main() {
  const contractAddress = "0x362826cE7c0d18E9029d1E5F4Bf4C0894eE749f6";
  const userAddress = "0x4fe9355E9Af58F585e75958219b86FCcCb8fAaC9"; // 你的地址
  
  const EnigmaVault = await hre.ethers.getContractAt("EnigmaVaultMock", contractAddress);

  console.log("\n🔍 检查用户已解决的谜题...\n");
  console.log("用户地址:", userAddress);
  console.log("");

  for (let i = 1; i <= 5; i++) {
    try {
      const hasSolved = await EnigmaVault.hasSolved(i, userAddress);
      const puzzle = await EnigmaVault.getPuzzle(i);
      console.log(`谜题 ${i}: ${puzzle[0]}`);
      console.log(`  已解决: ${hasSolved ? '✅ 是' : '❌ 否'}`);
      console.log("");
    } catch (error) {
      console.log(`谜题 ${i}: 查询失败`);
    }
  }

  // 检查用户积分
  const points = await EnigmaVault.playerPoints(userAddress);
  console.log(`\n📊 总积分: ${points.toString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
