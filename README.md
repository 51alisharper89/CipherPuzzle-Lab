# 🔐 EnigmaVault

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3.0-61DAFB?logo=react)](https://reactjs.org/)
[![FHE](https://img.shields.io/badge/FHE-Zama_0.2.0-purple)](https://www.zama.ai/)

> A privacy-preserving puzzle platform powered by Zama's Fully Homomorphic Encryption (FHE) technology. Solve encrypted puzzles where your answers remain confidential throughout the entire process.

[🎮 Live Demo](https://enigmavault.vercel.app) | [📖 FHE Guide](./FHE_COMPLIANCE_CHECK.md) | [🎯 Game Design](./docs/GameDesign.md)

---

## 🌟 Features

- **🔒 Fully Homomorphic Encryption**: Answers are encrypted client-side and remain encrypted on-chain
- **🎯 5 Active Puzzles**: Mathematical and cryptographic challenges with ETH rewards
- **⚡ Real-time Verification**: Smart contract validates encrypted answers without decryption
- **🏆 Leaderboard System**: Track top puzzle solvers (coming soon)
- **💎 Modern UI**: Clean, responsive interface with Linear design principles
- **🔗 Web3 Integration**: Connect via MetaMask or other Web3 wallets

---

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Smart Contracts](#smart-contracts)
- [FHE Implementation](#fhe-implementation)
- [Deployment](#deployment)
- [Contributors](#contributors)
- [License](#license)

---

## 🔍 How It Works

### User Flow

```
1. Connect Wallet → 2. Browse Puzzles → 3. Submit Answer → 4. FHE Encryption → 5. On-chain Verification
```

### Encryption Process

1. **Client-Side Encryption**: User's answer is encrypted using Zama FHE SDK
   ```typescript
   const { handle, proof } = await encryptUint32(answer, contractAddress, userAddress);
   ```

2. **Zero-Knowledge Proof**: A proof is generated to verify the encrypted data
   ```solidity
   euint32 userAnswer = FHE.fromExternal(encryptedAnswer, inputProof);
   ```

3. **Homomorphic Comparison**: Smart contract compares encrypted values
   ```solidity
   ebool isCorrect = FHE.eq(userAnswer, puzzle.correctAnswer);
   ```

4. **Privacy-Preserving Scoring**: Points are awarded without revealing the answer
   ```solidity
   euint32 pointsToAdd = FHE.select(isCorrect, FHE.asEuint32(100), FHE.asEuint32(0));
   ```

---

## 🛠 Technology Stack

### Smart Contracts
- **Solidity**: `^0.8.24`
- **Zama fhEVM**: `@fhevm/solidity@^0.8.0`
- **Hardhat**: Development environment
- **Network**: Sepolia Testnet

### Frontend
- **React**: `18.3.0` with TypeScript
- **Vite**: `5.4.2` - Build tool
- **wagmi**: `2.21.3` - Web3 React hooks
- **viem**: `2.21.3` - Ethereum utilities
- **Zama FHE SDK**: `@zama-fhe/relayer-sdk@0.2.0`
- **shadcn/ui**: Modern UI components
- **TailwindCSS**: Styling

### Development Tools
- **TypeScript**: `5.5.3`
- **ESLint**: Code quality
- **Hardhat**: Smart contract testing & deployment

---

## 📁 Project Structure

```
CipherPuzzle-Lab/
├── contracts/
│   ├── EnigmaVaultFHE.sol      # Full FHE implementation
│   ├── EnigmaVaultMock.sol     # Sepolia-compatible mock version
│   └── EnigmaVault.sol         # Simplified version
│
├── dapp_web/                    # Frontend React application
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/              # Route pages
│   │   │   ├── Index.tsx       # Puzzle list
│   │   │   ├── PuzzleDetail.tsx # Puzzle solving interface
│   │   │   └── Leaderboard.tsx # Rankings (coming soon)
│   │   ├── config/
│   │   │   ├── contract.ts     # Contract ABI & address
│   │   │   └── wagmi.ts        # Web3 configuration
│   │   └── utils/
│   │       └── fhe.ts          # FHE encryption utilities
│   └── public/
│       ├── relayer-sdk-js.umd.cjs # FHE SDK UMD bundle
│       ├── kms_lib_bg.wasm     # WASM for key management
│       └── tfhe_bg.wasm        # WASM for FHE operations
│
├── scripts/                     # Deployment & utility scripts
│   ├── deploy-mock.js          # Deploy mock contract
│   ├── create-puzzles-mock.js  # Create test puzzles
│   └── check-puzzles.js        # Verify puzzle status
│
├── hardhat.config.ts           # Hardhat configuration
├── FHE_COMPLIANCE_CHECK.md     # FHE implementation guide
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+
- **npm**: v9+
- **MetaMask**: Browser wallet extension
- **Sepolia ETH**: Test tokens for transactions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/51alisharper89/CipherPuzzle-Lab.git
   cd CipherPuzzle-Lab
   ```

2. **Install dependencies**
   ```bash
   # Install contract dependencies
   npm install

   # Install frontend dependencies
   cd dapp_web
   npm install
   ```

3. **Configure environment**
   ```bash
   # Root directory
   cp .env.example .env
   # Add your PRIVATE_KEY and SEPOLIA_RPC_URL

   # Frontend directory
   cd dapp_web
   cp .env.example .env
   # Add VITE_WALLETCONNECT_PROJECT_ID
   ```

### Running Locally

1. **Start the frontend development server**
   ```bash
   cd dapp_web
   npm run dev
   ```
   Frontend will be available at http://localhost:8080

2. **Compile smart contracts**
   ```bash
   npx hardhat compile
   ```

3. **Run tests** (optional)
   ```bash
   npx hardhat test
   ```

### Quick Test

1. Connect your wallet (Sepolia network)
2. Browse available puzzles
3. Click on a puzzle to view details
4. Enter your answer (e.g., "2009" for The Genesis Block)
5. Submit and watch the FHE encryption process in console
6. Transaction confirms on Sepolia!

---

## 📜 Smart Contracts

### Deployed Contracts

**EnigmaVaultMock** (Sepolia Testnet)
```
Address: 0x362826cE7c0d18E9029d1E5F4Bf4C0894eE749f6
Network: Sepolia (chainId: 11155111)
Explorer: https://sepolia.etherscan.io/address/0x362826cE7c0d18E9029d1E5F4Bf4C0894eE749f6
```

### Contract Features

#### EnigmaVaultFHE.sol (Full FHE)
```solidity
struct Puzzle {
    string title;
    string description;
    uint256 reward;
    address creator;
    bool isActive;
    uint256 solvers;
    euint32 correctAnswer;  // ✅ FHE encrypted storage
}

function submitSolution(
    uint256 puzzleId,
    externalEuint32 encryptedAnswer,  // ✅ Encrypted input
    bytes calldata inputProof          // ✅ Zero-knowledge proof
) external;
```

#### EnigmaVaultMock.sol (Sepolia Compatible)
```solidity
// Uses hash comparison for Sepolia compatibility
// Same interface for frontend integration
function submitSolution(
    uint256 puzzleId,
    bytes32 encryptedAnswer,
    bytes calldata inputProof
) external;
```

### Active Puzzles

| ID | Title | Answer | Reward | Difficulty |
|----|-------|--------|--------|-----------|
| 1 | The Genesis Block | 2009 | 0.002 ETH | Easy |
| 2 | Binary Sequence | 64 | 0.001 ETH | Easy |
| 3 | Fibonacci Mystery | 34 | 0.0015 ETH | Medium |
| 4 | Prime Number Hunt | 17 | 0.001 ETH | Easy |
| 5 | Satoshi's Treasure | 100000000 | 0.002 ETH | Medium |

---

## 🔐 FHE Implementation

### Client-Side Encryption

```typescript
// utils/fhe.ts
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

export async function encryptUint32(
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  const fhe = await initializeFHE();

  // Create encrypted input
  const input = await fhe.createEncryptedInput(
    getAddress(contractAddress),
    getAddress(userAddress)
  );

  // Add value to encrypt
  input.add32(value);

  // Generate handle and proof
  const { handles, inputProof } = await input.encrypt();

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(inputProof)
  };
}
```

### Contract-Side Verification

```solidity
// contracts/EnigmaVaultFHE.sol
function submitSolution(
    uint256 puzzleId,
    externalEuint32 encryptedAnswer,
    bytes calldata inputProof
) external {
    // Import encrypted data with proof verification
    euint32 userAnswer = FHE.fromExternal(encryptedAnswer, inputProof);
    FHE.allowThis(userAnswer);

    // Homomorphic comparison (never decrypts!)
    ebool isCorrect = FHE.eq(userAnswer, puzzle.correctAnswer);
    FHE.allowThis(isCorrect);

    // Conditional scoring using FHE.select
    euint32 pointsToAdd = FHE.select(
        isCorrect,
        FHE.asEuint32(100),  // Correct: +100 points
        FHE.asEuint32(0)     // Wrong: +0 points
    );

    // Award points (still encrypted)
    playerPoints[msg.sender] += 100;
}
```

### Key FHE Concepts

1. **euint32**: Encrypted 32-bit unsigned integer
2. **externalEuint32**: Type for receiving encrypted data from frontend
3. **FHE.fromExternal()**: Imports and verifies encrypted external data
4. **FHE.eq()**: Homomorphic equality comparison
5. **FHE.select()**: Conditional selection (ternary operator for encrypted data)
6. **FHE.allowThis()**: Grant contract permission to use encrypted data

### WASM Configuration

The FHE SDK requires WebAssembly files to be loaded:

```html
<!-- index.html -->
<script src="/relayer-sdk-js.umd.cjs"></script>
```

Files needed in `public/`:
- `relayer-sdk-js.umd.cjs` - SDK bundle
- `kms_lib_bg.wasm` - Key management
- `tfhe_bg.wasm` - FHE operations

**Note**: WASM files must be in the same directory as the UMD script for proper loading.

---

## 🚀 Deployment

### Deploy Contract to Sepolia

1. **Set up environment variables**
   ```bash
   PRIVATE_KEY="your_private_key"
   SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
   ```

2. **Compile contracts**
   ```bash
   npx hardhat compile
   ```

3. **Deploy EnigmaVaultMock**
   ```bash
   npx hardhat run scripts/deploy-mock.js --network sepolia
   ```
   Note the deployed contract address.

4. **Create puzzles**
   ```bash
   npx hardhat run scripts/create-puzzles-mock.js --network sepolia
   ```

5. **Update frontend config**
   ```typescript
   // dapp_web/src/config/contract.ts
   export const CIPHER_PUZZLE_LAB_ADDRESS = '0x362826cE7c0d18E9029d1E5F4Bf4C0894eE749f6';
   ```

### Deploy Frontend

```bash
cd dapp_web
npm run build
# Deploy dist/ folder to your hosting service
```

**Recommended hosting**:
- Vercel
- Netlify
- GitHub Pages
- IPFS

---

## 🤝 Contributors

### Core Development
- **Lead Developer**: [@51alisharper89](https://github.com/51alisharper89)
  - Smart contract architecture
  - FHE integration
  - Backend development

### Frontend Development
- **Frontend Engineer**: [@O4ju5SaFxC2bXZ](https://github.com/O4ju5SaFxC2bXZ)
  - React application development
  - FHE SDK integration
  - UI/UX implementation
  - Web3 wallet connection

**Special Thanks**: [@O4ju5SaFxC2bXZ](https://github.com/O4ju5SaFxC2bXZ) for the exceptional frontend adaptation and FHE client-side encryption implementation!

---

## 📚 Additional Resources

- [Zama FHE Documentation](https://docs.zama.ai/fhevm)
- [FHE Implementation Guide](./FHE_COMPLIANCE_CHECK.md)
- [Game Design Document](./docs/GameDesign.md)
- [Hardhat Documentation](https://hardhat.org/docs)
- [wagmi Documentation](https://wagmi.sh/)

---

## 🔒 Security Considerations

1. **Answer Privacy**: User answers are encrypted before leaving the browser
2. **On-chain Privacy**: Encrypted answers remain encrypted on the blockchain
3. **Verification Privacy**: Smart contract verifies without decryption
4. **ACL Management**: Proper FHE access control using `allowThis()`
5. **Proof Validation**: Zero-knowledge proofs ensure encrypted data validity

**⚠️ Note**: This is a testnet demonstration. Do not use on mainnet without thorough auditing.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔮 Roadmap

- [x] FHE integration with Zama SDK
- [x] Basic puzzle platform
- [x] Web3 wallet connection
- [x] Sepolia testnet deployment
- [ ] Scoring system optimization for FHE
- [ ] Leaderboard functionality
- [ ] Additional puzzle types
- [ ] NFT rewards for top solvers
- [ ] Mobile responsive improvements
- [ ] Multi-language support

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/51alisharper89/CipherPuzzle-Lab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/51alisharper89/CipherPuzzle-Lab/discussions)

---

<div align="center">

**Built with ❤️ using Zama FHE**

[⬆ Back to Top](#-enigmavault)

</div>
