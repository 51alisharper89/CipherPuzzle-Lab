# CipherPuzzle Lab

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![FHE](https://img.shields.io/badge/FHE-Zama_fhEVM_0.9.1-purple)](https://www.zama.ai/)

> A privacy-preserving puzzle platform powered by Zama's Fully Homomorphic Encryption (FHE) technology. Solve encrypted puzzles where your answers remain confidential throughout the entire process.

[Live Demo](https://cipherpuzzle-lab.vercel.app)

## Demo Video

<div align="center">

![CipherPuzzle Lab Demo](./.github/demo.mp4)

*See CipherPuzzle Lab in action: Connect wallet, solve encrypted puzzles, and watch FHE encryption work in real-time!*

**[Download Demo Video](./.github/demo.mp4)** | **[Try Live Demo](https://cipherpuzzle-lab.vercel.app)**

</div>

---

## Features

- **Fully Homomorphic Encryption**: Answers are encrypted client-side and remain encrypted on-chain
- **10 Active Puzzles**: Mathematical and cryptographic challenges with ETH rewards
- **Real-time Verification**: Smart contract validates encrypted answers without decryption
- **Activity Tracking**: View your puzzle solving history and rewards earned
- **Leaderboard System**: Track top puzzle solvers
- **Modern UI**: Clean, responsive interface with Linear design principles
- **Web3 Integration**: Connect via MetaMask, RainbowKit or other Web3 wallets

---

## Table of Contents

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

## How It Works

### User Flow

```
1. Connect Wallet → 2. Browse Puzzles → 3. Submit Answer → 4. FHE Encryption → 5. On-chain Verification
```

### Encryption Process

1. **Client-Side Encryption**: User's answer is encrypted using Zama FHE SDK (CDN loaded)
   ```typescript
   const input = instance.createEncryptedInput(contractAddress, userAddress);
   input.add32(answer);
   const { handles, inputProof } = await input.encrypt();
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

---

## Technology Stack

### Smart Contracts
- **Solidity**: `^0.8.24`
- **Zama fhEVM**: `@fhevm/solidity@^0.9.1`
- **Hardhat**: `^2.22.0`
- **Network**: Sepolia Testnet

### Frontend
- **React**: `18.3.1` with TypeScript
- **Vite**: `5.4.19` - Build tool
- **wagmi**: `2.18.1` - Web3 React hooks
- **viem**: `2.40.3` - Ethereum utilities
- **RainbowKit**: `2.2.9` - Wallet connection
- **Zama FHE SDK**: `@zama-fhe/relayer-sdk@0.3.0-5` (CDN loaded)
- **shadcn/ui**: Modern UI components
- **TailwindCSS**: `3.4.17` - Styling

### Development Tools
- **TypeScript**: `5.9.3`
- **ESLint**: Code quality
- **Hardhat**: Smart contract testing & deployment

---

## Project Structure

```
CipherPuzzle-Lab/
├── contracts/
│   ├── EnigmaVaultFHE.sol      # Full FHE implementation (deployed)
│   └── SimpleCounter.sol       # Test contract
│
├── dapp_web/                    # Frontend React application
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/
│   │   │   ├── Index.tsx        # Puzzle list
│   │   │   ├── PuzzleDetail.tsx # Puzzle solving interface
│   │   │   └── MyActivity.tsx   # User activity history
│   │   ├── config/
│   │   │   ├── contract.ts      # Contract ABI & address
│   │   │   └── wagmi.ts         # Web3 configuration
│   │   ├── hooks/
│   │   │   ├── useFHE.ts        # FHE encryption hook (CDN SDK)
│   │   │   ├── useContract.ts   # Contract interaction hooks
│   │   │   └── usePuzzleActions.ts # Puzzle action hooks
│   │   └── lib/
│   │       └── toast-utils.tsx  # Toast notification utilities
│   ├── index.html               # CDN script for FHE SDK
│   └── vercel.json              # SPA routing config
│
├── scripts/
│   ├── deploy-fhe.ts            # Deploy FHE contract
│   ├── create-puzzles-fhe.ts    # Create puzzles with FHE
│   └── create-puzzles.js        # Create test puzzles
│
├── test/                        # Contract tests
│   ├── EnigmaVault.test.js
│   ├── EnigmaVaultFHE.test.js
│   └── SimpleCounter.test.js
│
├── hardhat.config.ts            # Hardhat configuration
└── README.md                    # This file
```

---

## Getting Started

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
   Frontend will be available at http://localhost:5173

2. **Compile smart contracts**
   ```bash
   npm run compile
   ```

3. **Run tests**
   ```bash
   npm run test
   ```

### Quick Test

1. Connect your wallet (Sepolia network)
2. Browse available puzzles
3. Click on a puzzle to view details
4. Enter your answer
5. Submit and watch the FHE encryption process
6. Transaction confirms on Sepolia!

---

## Smart Contracts

### Deployed Contracts

**EnigmaVaultFHE** (Sepolia Testnet)
```
Address: 0x5A03982D1859C5A3f60745358F1b8d6019462C9B
Network: Sepolia (chainId: 11155111)
Explorer: https://sepolia.etherscan.io/address/0x5A03982D1859C5A3f60745358F1b8d6019462C9B
```

### Contract Features

#### EnigmaVaultFHE.sol
```solidity
struct Puzzle {
    string title;
    string description;
    uint256 reward;
    address creator;
    bool isActive;
    uint256 solvers;
    euint32 correctAnswer;  // FHE encrypted storage
}

function submitSolution(
    uint256 puzzleId,
    externalEuint32 encryptedAnswer,  // Encrypted input
    bytes calldata inputProof          // Zero-knowledge proof
) external;
```

### Active Puzzles

| ID | Title | Reward | Difficulty |
|----|-------|--------|-----------|
| 1 | The Genesis Block | 0.001 ETH | Easy |
| 2 | Binary Sequence | 0.001 ETH | Easy |
| 3 | Fibonacci Mystery | 0.0015 ETH | Medium |
| 4 | Prime Number Hunt | 0.001 ETH | Easy |
| 5 | Satoshi's Treasure | 0.002 ETH | Medium |
| 6 | The Golden Ratio | 0.0015 ETH | Medium |
| 7 | Hash Power | 0.001 ETH | Easy |
| 8 | Merkle Root | 0.002 ETH | Hard |
| 9 | Block Time | 0.001 ETH | Easy |
| 10 | Gas Limit | 0.0015 ETH | Medium |

---

## FHE Implementation

### Client-Side Encryption (CDN SDK)

```typescript
// hooks/useFHE.ts
// SDK is loaded via CDN in index.html
const sdk = window.RelayerSDK;
const { initSDK, createInstance, SepoliaConfig } = sdk;

await initSDK();
const instance = await createInstance({ ...SepoliaConfig, network: provider });

// Encrypt answer
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add32(answerValue);
const { handles, inputProof } = await input.encrypt();
```

### CDN Script (index.html)
```html
<script
  src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"
  defer
  crossorigin="anonymous"
></script>
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

    // Award points based on result
    // ...
}
```

### Key FHE Concepts

1. **euint32**: Encrypted 32-bit unsigned integer
2. **externalEuint32**: Type for receiving encrypted data from frontend
3. **FHE.fromExternal()**: Imports and verifies encrypted external data
4. **FHE.eq()**: Homomorphic equality comparison
5. **FHE.allowThis()**: Grant contract permission to use encrypted data

---

## Deployment

### Deploy Contract to Sepolia

1. **Set up environment variables**
   ```bash
   PRIVATE_KEY="your_private_key"
   SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
   ```

2. **Compile contracts**
   ```bash
   npm run compile
   ```

3. **Deploy EnigmaVaultFHE**
   ```bash
   SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" npx hardhat run scripts/deploy-fhe.ts --network sepolia
   ```

4. **Create puzzles**
   ```bash
   SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" npx hardhat run scripts/create-puzzles-fhe.ts --network sepolia
   ```

5. **Update frontend config**
   ```typescript
   // dapp_web/src/config/contract.ts
   export const CIPHER_PUZZLE_LAB_ADDRESS = '0x5A03982D1859C5A3f60745358F1b8d6019462C9B';
   ```

### Deploy Frontend

```bash
cd dapp_web
npm run build
# Deploy dist/ folder to Vercel or other hosting
```

**Live URL**: https://cipherpuzzle-lab.vercel.app

---

## Contributors

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

---

## Additional Resources

- [Zama FHE Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs)

---

## Security Considerations

1. **Answer Privacy**: User answers are encrypted before leaving the browser
2. **On-chain Privacy**: Encrypted answers remain encrypted on the blockchain
3. **Verification Privacy**: Smart contract verifies without decryption
4. **ACL Management**: Proper FHE access control using `allowThis()`
5. **Proof Validation**: Zero-knowledge proofs ensure encrypted data validity

**Note**: This is a testnet demonstration. Do not use on mainnet without thorough auditing.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Roadmap

- [x] FHE integration with Zama SDK
- [x] Basic puzzle platform
- [x] Web3 wallet connection
- [x] Sepolia testnet deployment
- [x] Activity tracking page
- [x] Leaderboard functionality
- [ ] Additional puzzle types
- [ ] NFT rewards for top solvers
- [ ] Mobile responsive improvements
- [ ] Multi-language support

---

## Support

- **Issues**: [GitHub Issues](https://github.com/51alisharper89/CipherPuzzle-Lab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/51alisharper89/CipherPuzzle-Lab/discussions)

---

<div align="center">

**Built with Zama FHE**

[Back to Top](#cipherpuzzle-lab)

</div>
