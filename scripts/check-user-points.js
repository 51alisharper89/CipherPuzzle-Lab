const hre = require("hardhat");

async function main() {
  const contractAddress = "0x362826cE7c0d18E9029d1E5F4Bf4C0894eE749f6";
  const userAddress = "0x4fe9355E9Af58F585e75958219b86FCcCb8fAaC9";
  
  const contract = await hre.ethers.getContractAt("EnigmaVaultMock", contractAddress);

  console.log("\n🔍 检查用户积分和解题状态...\n");
  console.log("合约地址:", contractAddress);
  console.log("用户地址:", userAddress);
  console.log("");

  // 检查每个谜题的解题状态
  for (let i = 1; i <= 5; i++) {
    const solved = await contract.hasSolved(i, userAddress);
    const puzzle = await contract.getPuzzle(i);
    if (puzzle[4]) {
      console.log(`谜题 ${i}: ${puzzle[0]}`);
      console.log(`  你已解决: ${solved ? '✅ 是' : '❌ 否'}`);
    }
  }

  console.log("");
  
  // 检查总积分
  const points = await contract.playerPoints(userAddress);
  console.log(`📊 你的总积分: ${points.toString()}`);
  
  // 检查是否在玩家列表中
  const hasPlayed = await contract.hasPlayed(userAddress);
  console.log(`📋 是否在玩家列表: ${hasPlayed ? '✅ 是' : '❌ 否'}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
