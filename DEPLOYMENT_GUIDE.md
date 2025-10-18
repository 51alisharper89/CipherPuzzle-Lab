# CipherPuzzle-Lab Contract Deployment Guide

## 📋 Preparation

### 1. Install Hardhat and Dependencies

```bash
cd /Users/songsu/Desktop/zama/CipherPuzzle-Lab

# Create Hardhat project
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @fhevm/solidity

# Initialize Hardhat
npx hardhat
# Choose: Create a JavaScript project
```

### 2. Configure Hardhat

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

// Get private key from environment variable (DO NOT commit to Git)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gas: 10000000, // FHE operations require higher Gas
      gasPrice: 20000000000 // 20 Gwei
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

### 3. Set Environment Variables

Create `.env` file (DO NOT commit to Git!):

```bash
# .env
PRIVATE_KEY=your_wallet_private_key_from_MetaMask
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=your_Etherscan_API_Key_optional_for_verification
```

⚠️ **Important**: Add `.env` to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

### 4. Get Sepolia Test Tokens

Visit these faucets to get free test ETH:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

Recommended to get at least 0.5 ETH for deployment and testing.

## 🚀 Deployment Steps

### 1. Create Deployment Script

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting CipherPuzzleLab contract deployment...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance < hre.ethers.parseEther("0.1")) {
    console.warn("⚠️  Warning: Balance less than 0.1 ETH, deployment may fail");
  }

  // Deploy contract
  console.log("\n📦 Deploying contract...");
  const CipherPuzzleLab = await hre.ethers.getContractFactory("CipherPuzzleLab");
  const contract = await CipherPuzzleLab.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await contract.owner();
  console.log("👤 Contract Owner:", owner);
  console.log("✓ Owner verification:", owner === deployer.address ? "Passed" : "Failed");

  // Save deployment info
  const deployInfo = {
    network: "sepolia",
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    txHash: contract.deploymentTransaction().hash
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deployInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info.json");

  // Frontend configuration update reminder
  console.log("\n📝 Next steps:");
  console.log("1. Update frontend configuration file:");
  console.log(`   frontend/src/config/contract.ts`);
  console.log(`   CIPHER_PUZZLE_LAB_ADDRESS = '${contractAddress}'`);
  console.log("\n2. Verify contract (optional):");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("\n3. Start frontend:");
  console.log(`   cd frontend && npm run dev`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
```

### 2. Move Contract File

```bash
# Move contract to Hardhat project structure
mkdir -p contracts
cp contracts/CipherPuzzleLab.sol contracts/
```

### 3. Compile Contract

```bash
npx hardhat compile
```

Output should show:
```
✓ Compiled successfully
```

### 4. Local Testing (Optional but Recommended)

```bash
# Start local node
npx hardhat node

# Deploy to local in another terminal
npx hardhat run scripts/deploy.js --network localhost
```

### 5. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
🚀 Starting CipherPuzzleLab contract deployment...
📝 Deployer account: 0x1234...5678
💰 Account balance: 0.5 ETH

📦 Deploying contract...

✅ Contract deployed successfully!
📍 Contract address: 0xABCD...EF01
🔗 Etherscan: https://sepolia.etherscan.io/address/0xABCD...EF01

🔍 Verifying deployment...
👤 Contract Owner: 0x1234...5678
✓ Owner verification: Passed

💾 Deployment info saved to deployment-info.json

📝 Next steps:
1. Update frontend configuration file:
   frontend/src/config/contract.ts
   CIPHER_PUZZLE_LAB_ADDRESS = '0xABCD...EF01'

2. Verify contract (optional):
   npx hardhat verify --network sepolia 0xABCD...EF01

3. Start frontend:
   cd frontend && npm run dev
```

## ✅ Post-Deployment Verification

### 1. Update Frontend Configuration

Open `frontend/src/config/contract.ts`:

```typescript
export const CIPHER_PUZZLE_LAB_ADDRESS = '0xABCD...EF01' as const; // Replace with actual address
```

### 2. Verify Contract (Optional but Recommended)

Verify contract code on Etherscan:

```bash
npx hardhat verify --network sepolia 0xABCD...EF01
```

After successful verification, you can interact with the contract directly on Etherscan.

### 3. Test Contract Functions

```bash
# Create test script scripts/test-deployed.js
npx hardhat run scripts/test-deployed.js --network sepolia
```

`scripts/test-deployed.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = "0xABCD...EF01"; // Your contract address
  const CipherPuzzleLab = await hre.ethers.getContractAt(
    "CipherPuzzleLab",
    contractAddress
  );

  console.log("📊 Reading contract info...");

  // Test read functions
  const owner = await CipherPuzzleLab.owner();
  console.log("Owner:", owner);

  const [totalPuzzles, totalAttempts, totalPrizeDistributed] =
    await CipherPuzzleLab.getGlobalStatistics();
  console.log("Total puzzles:", totalPuzzles.toString());
  console.log("Total attempts:", totalAttempts.toString());
  console.log("Total prize distributed:", hre.ethers.formatEther(totalPrizeDistributed), "ETH");

  const platformFee = await CipherPuzzleLab.platformFee();
  console.log("Platform fee:", platformFee.toString(), "basis points (", platformFee / 100, "%)");

  console.log("\n✅ Contract test passed!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

## 🔐 Security Tips

### 1. Private Key Security
- ❌ NEVER commit private key to Git
- ✅ Use environment variables to store private key
- ✅ Add `.env` to `.gitignore`
- ✅ Use dedicated wallet for deployment (not main wallet)

### 2. Contract Verification
- ✅ Verify contract code on Etherscan
- ✅ Ensure verified code matches local code
- ✅ Check constructor parameters are correct

### 3. Permission Management
- ✅ Record Owner, PuzzleMaster, RewardManager addresses
- ✅ Consider using multi-sig wallet for critical permissions
- ✅ Test permission-related functions

## 📊 Gas Cost Estimates

Based on FHE operation characteristics, estimated Gas costs:

| Operation | Estimated Gas | Sepolia Test Token Cost (20 Gwei) |
|-----------|--------------|-----------------------------------|
| Deploy contract | ~5,000,000 | ~0.1 ETH |
| Create puzzle | ~500,000 | ~0.01 ETH |
| Submit answer | ~300,000 | ~0.006 ETH |
| Purchase hint | ~200,000 | ~0.004 ETH |
| End puzzle | ~150,000 | ~0.003 ETH |
| Reveal solution | ~200,000 | ~0.004 ETH |
| Distribute rewards | ~300,000 | ~0.006 ETH |

**Total**: Recommended to prepare at least **0.5 ETH** for complete testing flow.

## 🐛 Common Issues

### Q: Deployment fails with "insufficient funds"
A: Ensure account has enough Sepolia ETH (at least 0.1 ETH)

### Q: Compilation error "File import callback not supported"
A: Ensure `@fhevm/solidity` package is installed

### Q: Transaction stuck (pending)
A: Sepolia network may be congested, wait or increase gasPrice

### Q: Verification fails
A: Ensure compiler version and optimization settings match deployment

## 📞 Get Help

- Hardhat documentation: https://hardhat.org/docs
- Zama fhEVM documentation: https://docs.zama.ai/fhevm
- Sepolia block explorer: https://sepolia.etherscan.io/

---

**Created**: 2025-10-18
**Applicable Version**: Hardhat 2.19+, Solidity 0.8.24
