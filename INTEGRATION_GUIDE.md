# CipherPuzzle-Lab Frontend-Contract Integration Guide

## 📋 Overview

This guide documents the complete integration between the CipherPuzzle-Lab frontend (React + Vite + shadcn/ui) and the FHE-encrypted smart contracts on Sepolia testnet.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Components (shadcn/ui)                               │  │
│  │  - CreatePuzzle, SolvePuzzle, Leaderboard            │  │
│  └──────────────────┬────────────────────────────────────┘  │
│                     │                                        │
│  ┌──────────────────▼────────────────────────────────────┐  │
│  │  Hooks                                                │  │
│  │  - useFHE (FHE instance management)                   │  │
│  │  - usePuzzleActions (encrypted operations)            │  │
│  │  - useContract (contract reads/writes)                │  │
│  └──────────────────┬────────────────────────────────────┘  │
│                     │                                        │
│  ┌──────────────────▼────────────────────────────────────┐  │
│  │  Utils                                                │  │
│  │  - fhe.ts (SDK initialization & encryption)           │  │
│  └──────────────────┬────────────────────────────────────┘  │
│                     │                                        │
│  ┌──────────────────▼────────────────────────────────────┐  │
│  │  Config                                               │  │
│  │  - wagmi.ts (Sepolia network)                         │  │
│  │  - contract.ts (ABI, address, types)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 1. Encrypt with FHE SDK
                       │ 2. Submit transaction
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Zama FHE SDK (CDN 0.2.0)                        │
│  - createEncryptedInput()                                    │
│  - encrypt() → handles + inputProof                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│           CipherPuzzleLab.sol (Sepolia)                      │
│  - FHE.fromExternal(encrypted, proof)                        │
│  - FHE operations (add, eq, gt, select, etc.)                │
│  - Gateway.requestDecryption() for reveals                   │
└──────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
CipherPuzzle-Lab/
├── contracts/
│   └── CipherPuzzleLab.sol         # Smart contract with FHE operations
└── frontend/
    ├── src/
    │   ├── config/
    │   │   ├── wagmi.ts             # ✅ Wagmi config (Sepolia)
    │   │   └── contract.ts          # ✅ Contract ABI, address, types
    │   ├── utils/
    │   │   └── fhe.ts               # ✅ FHE SDK initialization & encryption
    │   ├── hooks/
    │   │   ├── useFHE.ts            # ✅ React hook for FHE instance
    │   │   ├── useContract.ts       # ✅ Contract read/write hooks
    │   │   └── usePuzzleActions.ts  # ✅ Combined FHE + contract hooks
    │   ├── components/              # Your existing UI components
    │   └── pages/                   # Your existing pages
    └── package.json
```

## 🔧 Installation Steps

### 1. Install Missing Dependencies

```bash
cd frontend
npm install ethers@^6.15.0
```

The `ethers` package is required for address checksumming (`getAddress`) used in FHE encryption.

### 2. Update Contract Address

After deploying the contract to Sepolia, update the address in:

**`frontend/src/config/contract.ts`**
```typescript
export const CIPHER_PUZZLE_LAB_ADDRESS = '0xYourDeployedContractAddress' as const;
```

### 3. Set Up WalletConnect (Optional)

For better wallet support, get a free project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/):

**`frontend/src/config/wagmi.ts`**
```typescript
projectId: 'your_actual_project_id',
```

## 🚀 Usage Examples

### Example 1: Create an Encrypted Puzzle

```typescript
import { useCreateEncryptedPuzzle } from '../hooks/usePuzzleActions';
import { DifficultyLevel } from '../config/contract';

function CreatePuzzleForm() {
  const { create, isLoading, isSuccess, error } = useCreateEncryptedPuzzle();

  const handleSubmit = async () => {
    await create({
      puzzleId: 1n,
      title: "Math Challenge",
      description: "What is 2 + 2?",
      solution: 4n,                    // Encrypted on client side
      difficultyScore: 100,             // Encrypted
      difficulty: DifficultyLevel.Beginner,
      durationInDays: 7,
      maxAttempts: 3,
      availableHints: 2,
      prizePoolInEth: "0.1"
    });
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Puzzle'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {isSuccess && <p className="text-green-500">Puzzle created!</p>}
    </div>
  );
}
```

### Example 2: Submit an Encrypted Attempt

```typescript
import { useSubmitEncryptedAttempt } from '../hooks/usePuzzleActions';

function SolvePuzzleForm({ puzzleId }: { puzzleId: bigint }) {
  const { submit, isLoading, isSuccess, error } = useSubmitEncryptedAttempt();
  const [answer, setAnswer] = useState('');

  const handleSubmit = async () => {
    const startTime = Date.now();

    await submit({
      puzzleId,
      answer: BigInt(answer),           // Encrypted on client side
      timeTakenInSeconds: Math.floor((Date.now() - startTime) / 1000)
    });
  };

  return (
    <div>
      <input
        type="number"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Your answer"
      />
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit Answer'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {isSuccess && <p className="text-green-500">Answer submitted!</p>}
    </div>
  );
}
```

### Example 3: Read Puzzle Info

```typescript
import { useGetPuzzleInfo } from '../hooks/useContract';
import { PuzzleStatus, DifficultyLevel } from '../config/contract';

function PuzzleCard({ puzzleId }: { puzzleId: bigint }) {
  const { data, isLoading, error } = useGetPuzzleInfo(puzzleId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const [creator, title, difficulty, prizePool, deadline, status] = data || [];

  return (
    <div className="p-4 border rounded">
      <h3>{title}</h3>
      <p>Creator: {creator}</p>
      <p>Difficulty: {DifficultyLevel[difficulty]}</p>
      <p>Prize Pool: {prizePool.toString()} wei</p>
      <p>Status: {PuzzleStatus[status]}</p>
      <p>Deadline: {new Date(Number(deadline) * 1000).toLocaleString()}</p>
    </div>
  );
}
```

### Example 4: Initialize FHE in App Root

```typescript
// src/App.tsx
import { useFHE } from './hooks/useFHE';

function App() {
  const { fhe, isInitialized, isLoading, error } = useFHE();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Initializing FHE encryption...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500">FHE Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Please ensure you're on Sepolia testnet
          </p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please connect your wallet to Sepolia testnet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Your app components */}
    </div>
  );
}
```

## 🔐 How FHE Encryption Works

### Client-Side Encryption Flow

```typescript
// 1. User creates a puzzle with solution = 42
const solution = 42n;

// 2. FHE SDK encrypts the value
const { handle, proof } = await encryptUint64(
  solution,
  contractAddress,
  userAddress
);
// handle:  0x1a2b3c4d... (encrypted data)
// proof:   0x5e6f7g8h... (zero-knowledge proof)

// 3. Submit to contract
await contract.createPuzzle(
  puzzleId,
  title,
  description,
  handle,     // Encrypted solution
  proof,      // Proof of correct encryption
  ...
);

// 4. Contract verifies and stores encrypted data
// euint64 solution = FHE.fromExternal(handle, proof);
// puzzle.encryptedSolutionCipher = solution;
```

### On-Chain Computation

```solidity
// Contract can perform operations on encrypted data
// without ever seeing the plaintext values

// Check if answer equals solution (both encrypted)
ebool isCorrect = FHE.eq(encryptedAnswer, encryptedSolution);

// Calculate score based on encrypted comparison
euint8 score = FHE.select(
    isCorrect,
    FHE.asEuint8(100),  // If correct, score = 100
    FHE.asEuint8(0)     // If wrong, score = 0
);

// Result is still encrypted!
```

### Decryption (When Puzzle Ends)

```solidity
// Only after puzzle ends, creator can request decryption
function requestSolutionReveal(uint256 puzzleId) external {
    require(puzzle.status == PuzzleStatus.Ended);

    uint256[] memory cts = new uint256[](1);
    cts[0] = Gateway.toUint256(puzzle.encryptedSolutionCipher);

    uint256 requestId = Gateway.requestDecryption(
        cts,
        this.callbackSolutionReveal.selector,
        ...
    );
}

// Gateway calls back with decrypted value
function callbackSolutionReveal(uint256 requestId, uint64 solution) public {
    puzzle.revealedSolution = solution;
    puzzle.isRevealed = true;
    emit PuzzleRevealed(puzzleId, solution);
}
```

## 📝 Contract Deployment Checklist

- [ ] Deploy `CipherPuzzleLab.sol` to Sepolia
- [ ] Update `CIPHER_PUZZLE_LAB_ADDRESS` in `frontend/src/config/contract.ts`
- [ ] Verify contract on Sepolia Etherscan
- [ ] Test createPuzzle with small prize pool (0.01 ETH)
- [ ] Test submitAttempt with encrypted answer
- [ ] Test end puzzle → reveal solution flow
- [ ] Test leaderboard decryption
- [ ] Test reward distribution

## 🧪 Testing Workflow

### 1. Local Development

```bash
cd frontend
npm run dev
```

### 2. Connect Wallet
- Open http://localhost:5173
- Click "Connect Wallet"
- Switch to Sepolia testnet
- Wait for FHE initialization (should see "✅ Instance initialized successfully" in console)

### 3. Create Test Puzzle

```typescript
// Use the CreatePuzzle form in your UI
{
  puzzleId: 1n,
  title: "Test Puzzle",
  solution: 42n,
  prizePoolInEth: "0.01"
}
```

### 4. Verify on Sepolia

- Check transaction on https://sepolia.etherscan.io
- Look for `PuzzleCreated` event
- Storage should show encrypted data (long hex strings)

### 5. Submit Test Attempt

```typescript
// Use SolvePuzzle form
{
  puzzleId: 1n,
  answer: 42n  // Correct answer
}
```

### 6. Check Console Logs

```
[FHE] Loading SDK from CDN...
[FHE] ✅ Instance initialized successfully
[Encryption] Encrypting value...
[Encryption] ✅ Encrypted successfully
[Transaction] Submitted, waiting for confirmation...
[Transaction] ✅ Confirmed
```

## 🐛 Troubleshooting

### Error: "FHE not initialized"
- Ensure you're connected to Sepolia testnet (chainId 11155111)
- Check that MetaMask is installed and unlocked
- Refresh the page

### Error: "Failed to initialize FHE instance"
- Check browser console for detailed error
- Ensure you have internet connection (CDN needs to load)
- Try clearing browser cache

### Error: "Decryption service temporarily unavailable"
- This is normal if Gateway is busy
- Wait a few seconds and retry
- Check Zama's service status

### Transaction Fails with "PuzzleNotFound"
- Ensure puzzle exists (check puzzleId)
- Ensure puzzle status is correct (Draft → Active → Ended)

### High Gas Costs
- FHE operations are expensive by nature
- Use smaller encrypted types when possible (euint8 < euint32 < euint64)
- Batch operations when possible

## 📚 Additional Resources

- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [FHE Complete Guide](./FHE_COMPLETE_GUIDE_FULL_CN.md)
- [wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)

## 🎯 Next Steps

1. **Deploy Contract**: Deploy to Sepolia and update address
2. **Test Integration**: Run through complete create → solve → reveal flow
3. **Add UI Polish**: Enhance loading states, error messages
4. **Add Features**:
   - Puzzle listing page
   - Player leaderboard view
   - Profile statistics
   - Hint purchase UI
5. **Security Audit**: Review before mainnet deployment

## 📞 Support

If you encounter issues:
1. Check console logs for detailed errors
2. Verify you're on Sepolia testnet
3. Ensure contract is deployed and address is correct
4. Check that all dependencies are installed

---

**Created**: 2025-10-18
**Last Updated**: 2025-10-18
**Version**: 1.0.0
