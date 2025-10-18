import { ethers } from "hardhat";
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

const puzzles = [
  {
    id: 1,
    title: "The Genesis Block",
    description: "In the beginning, there was a hash. Find the first value that started it all. Hint: Think Bitcoin's genesis block year.",
    answer: 2009,  // Bitcoin genesis block year
    reward: "0.002"
  },
  {
    id: 2,
    title: "Binary Sequence",
    description: "Complete the sequence: 1, 2, 4, 8, 16, 32, ?",
    answer: 64,  // Next power of 2
    reward: "0.001"
  },
  {
    id: 3,
    title: "Fibonacci Mystery",
    description: "Find the 10th number in the Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, ?",
    answer: 34,  // 10th Fibonacci number
    reward: "0.0015"
  }
];

async function main() {
  console.log("🔐 Creating FHE-encrypted puzzles...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  const contractAddress = "0x466Ff659A123726119Ab0836d2E6980f2A770817";
  const EnigmaVault = await ethers.getContractAt("EnigmaVaultFHE", contractAddress);

  // ✅ Step 1: Initialize FHE SDK
  console.log("🚀 Initializing FHE SDK...");
  await initSDK();
  const fheInstance = await createInstance(SepoliaConfig);
  console.log("✅ FHE SDK initialized\n");

  let successCount = 0;
  let failCount = 0;

  for (const puzzle of puzzles) {
    try {
      console.log(`\n⏳ Creating Puzzle #${puzzle.id}: ${puzzle.title}`);
      console.log(`   📊 Answer (will be encrypted): ${puzzle.answer}`);

      // ✅ Step 2: Encrypt the correct answer using FHE
      console.log(`   🔐 Encrypting answer with FHE...`);

      const input = fheInstance.createEncryptedInput(
        contractAddress as `0x${string}`,
        deployer.address
      );

      input.add32(puzzle.answer);
      const { handles, inputProof } = await input.encrypt();

      console.log(`   ✅ Answer encrypted!`);
      console.log(`      Handle: ${handles[0].substring(0, 20)}...`);
      console.log(`      Proof length: ${inputProof.length} bytes`);

      // ✅ Step 3: Submit to blockchain with encrypted answer
      console.log(`   📤 Submitting to blockchain...`);

      const tx = await EnigmaVault.createPuzzle(
        puzzle.id,
        puzzle.title,
        puzzle.description,
        handles[0],     // externalEuint32 encryptedAnswer
        inputProof,     // bytes inputProof
        { value: ethers.parseEther(puzzle.reward) }
      );

      const receipt = await tx.wait();
      console.log(`   ✅ Success! Gas: ${receipt?.gasUsed.toString()}, Reward: ${puzzle.reward} ETH`);
      console.log(`   📋 Transaction: ${tx.hash}`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message.split('\n')[0]}`);
      failCount++;
    }
  }

  console.log(`\n🎉 Puzzle creation complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${puzzles.length}`);

  if (successCount > 0) {
    console.log(`\n🔒 All puzzle answers are now encrypted on-chain using FHE!`);
    console.log(`   Users must submit encrypted answers to solve them.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Critical error:", error);
    process.exit(1);
  });
