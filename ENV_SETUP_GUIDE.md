# Environment Configuration Guide 🔧

## 📋 Quick Start

### 1. Frontend Environment Configuration

```bash
cd frontend

# Configuration file already created at .env.local
# You need to manually fill in the following:
```

Open `frontend/.env.local` and fill in:

```bash
# TODO: Fill in contract address after deployment
VITE_CONTRACT_ADDRESS=0xYourContractAddress

# TODO: (Optional) Get Project ID from WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 2. Contract Deployment Environment Configuration

```bash
# Configuration file already created at root .env
# You need to manually fill in the following:
```

Open `.env` and fill in:

```bash
# TODO: Export private key from MetaMask
PRIVATE_KEY=your_private_key_here

# TODO: (Optional) Get API Key from Etherscan
ETHERSCAN_API_KEY=your_etherscan_api_key
```

---

## 🔐 Getting Required Configuration Items

### 1. Get MetaMask Private Key

**⚠️ Important**: Use dedicated test wallet, not main wallet!

Steps:
1. Open MetaMask
2. Click three dots in upper right → Account Details
3. Click "Export Private Key"
4. Enter password
5. Copy private key
6. Paste after `PRIVATE_KEY=` in `.env` file

### 2. Get Sepolia Test Tokens

You need at least **0.5 ETH** for deployment and testing.

**Recommended Faucets** (free):
1. **Alchemy Faucet** - https://sepoliafaucet.com/
   - 0.5 ETH per day
   - Requires Alchemy account

2. **QuickNode Faucet** - https://faucet.quicknode.com/ethereum/sepolia
   - 0.1 ETH per day
   - Requires Twitter account

3. **Infura Faucet** - https://www.infura.io/faucet/sepolia
   - 0.5 ETH per day
   - Requires Infura account

4. **PoW Faucet** - https://sepolia-faucet.pk910.de/
   - Get through mining
   - No limit but takes time

### 3. Get Etherscan API Key (Optional but Recommended)

Used to verify contract code on Etherscan.

Steps:
1. Visit https://etherscan.io/
2. Register/login account
3. Go to API Keys page: https://etherscan.io/myapikey
4. Create new API Key
5. Copy API Key
6. Paste after `ETHERSCAN_API_KEY=` in `.env` file

### 4. Get WalletConnect Project ID (Optional but Recommended)

For better wallet connection experience.

Steps:
1. Visit https://cloud.walletconnect.com/
2. Register/login account (free)
3. Create new project
4. Copy Project ID
5. Paste after `VITE_WALLETCONNECT_PROJECT_ID=` in `frontend/.env.local` file

---

## 📂 File Structure Description

```
CipherPuzzle-Lab/
├── .env                        # Contract deployment config (sensitive, not committed to Git)
├── .env.example                # Contract deployment config template
├── .gitignore                  # Git ignore rules (protect sensitive files)
│
└── frontend/
    ├── .env.local              # Frontend local config (sensitive, not committed to Git)
    └── .env.example            # Frontend config template
```

### Configuration File Description

| File | Purpose | Commit to Git | Sensitive |
|------|---------|--------------|-----------|
| `.env` | Contract deployment config | ❌ No | ✅ Yes (private key) |
| `.env.example` | Contract config template | ✅ Yes | ❌ No |
| `frontend/.env.local` | Frontend local config | ❌ No | ⚠️ Partial (contract address) |
| `frontend/.env.example` | Frontend config template | ✅ Yes | ❌ No |

---

## ✅ Configuration Verification Checklist

### Before Contract Deployment

- [ ] `.env` file created
- [ ] `PRIVATE_KEY` filled in (64-character hex)
- [ ] Test wallet has enough Sepolia ETH (at least 0.5 ETH)
- [ ] `SEPOLIA_RPC_URL` accessible
- [ ] (Optional) `ETHERSCAN_API_KEY` filled in

Verification command:
```bash
# Check wallet balance
cast balance $YOUR_ADDRESS --rpc-url $SEPOLIA_RPC_URL

# Or check in MetaMask by switching to Sepolia network
```

### Before Frontend Startup

- [ ] `frontend/.env.local` file created
- [ ] Dependencies installed (`npm install`)
- [ ] (After deployment) `VITE_CONTRACT_ADDRESS` updated
- [ ] (Optional) `VITE_WALLETCONNECT_PROJECT_ID` filled in

Verification command:
```bash
cd frontend
npm run dev
# Should start normally, visit http://localhost:5173
```

---

## 🚨 Security Tips

### ⚠️ NEVER:

1. ❌ Commit `.env` or `.env.local` to Git
2. ❌ Use main wallet private key in `.env`
3. ❌ Share screenshots or logs containing private key
4. ❌ Copy private key to insecure places
5. ❌ Display screen containing private key in public places

### ✅ SHOULD:

1. ✅ Use dedicated test wallet
2. ✅ Regularly check if `.gitignore` is working
3. ✅ Clear mainnet assets from test wallet before deployment
4. ✅ Use environment variables instead of hardcoding
5. ✅ Immediately backup contract address after deployment

### Check if Files are Tracked by Git

```bash
# Ensure sensitive files are not tracked by Git
git status

# Should NOT see these files:
# - .env
# - frontend/.env.local
# - deployment-info.json

# If you see them, execute:
git rm --cached .env
git rm --cached frontend/.env.local
```

---

## 🔄 Configuration Update Process

### After Contract Deployment

1. **Get Contract Address**:
   ```bash
   # From console output or deployment-info.json
   cat deployment-info.json | grep contractAddress
   ```

2. **Update Frontend Config**:
   ```bash
   # Edit frontend/.env.local
   VITE_CONTRACT_ADDRESS=0xYourActualContractAddress
   ```

3. **Also Update**:
   ```typescript
   // frontend/src/config/contract.ts
   export const CIPHER_PUZZLE_LAB_ADDRESS = '0xYourActualContractAddress' as const;
   ```

4. **Restart Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 📝 Environment Variable Reference

### Frontend Environment Variables (frontend/.env.local)

| Variable Name | Required | Default | Description |
|--------------|----------|---------|-------------|
| `VITE_CONTRACT_ADDRESS` | ✅ | - | Deployed contract address |
| `VITE_CHAIN_ID` | ✅ | 11155111 | Sepolia chain ID |
| `VITE_SEPOLIA_RPC_URL` | ❌ | PublicNode | Sepolia RPC node |
| `VITE_WALLETCONNECT_PROJECT_ID` | ❌ | - | WalletConnect project ID |
| `VITE_DEBUG_FHE` | ❌ | true | FHE debug logging |

### Contract Environment Variables (.env)

| Variable Name | Required | Default | Description |
|--------------|----------|---------|-------------|
| `PRIVATE_KEY` | ✅ | - | Deployer private key |
| `SEPOLIA_RPC_URL` | ✅ | PublicNode | Sepolia RPC node |
| `ETHERSCAN_API_KEY` | ❌ | - | Etherscan API key |
| `PLATFORM_FEE` | ❌ | 250 | Platform fee (2.5%) |
| `HINT_BASE_COST` | ❌ | 0.001 ETH | Hint base price |

---

## 🛠️ Troubleshooting

### Issue: `PRIVATE_KEY` format error

**Symptom**: Deployment error "invalid private key"

**Solution**:
```bash
# Ensure private key is 64-character hex (with or without 0x prefix)
# Correct format:
PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
# Or
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Issue: RPC connection failure

**Symptom**: "failed to fetch" or "network error"

**Solution**:
```bash
# Try other free RPCs:
SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia
# Or
SEPOLIA_RPC_URL=https://eth-sepolia.public.blastapi.io
```

### Issue: Frontend environment variables not working

**Symptom**: Reading environment variable returns undefined

**Solution**:
1. Ensure file name is `.env.local` not `.env`
2. Variable name must start with `VITE_`
3. Need to restart dev server after modifying `.env.local`

```bash
# Restart dev server
cd frontend
# Ctrl+C to stop
npm run dev  # Restart
```

---

## 📚 References

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Hardhat Configuration Guide](https://hardhat.org/hardhat-runner/docs/config)
- [Sepolia Testnet Information](https://sepolia.dev/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)

---

**Created**: 2025-10-18
**Last Updated**: 2025-10-18
