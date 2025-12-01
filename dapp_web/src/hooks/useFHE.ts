import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { bytesToHex, getAddress } from 'viem';
import { CIPHER_PUZZLE_LAB_ADDRESS } from '../config/contract';

// Declare global types for the CDN-loaded RelayerSDK
declare global {
  interface Window {
    RelayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: any) => Promise<any>;
      SepoliaConfig: any;
    };
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: any) => Promise<any>;
      SepoliaConfig: any;
    };
    ethereum?: any;
    okxwallet?: any;
  }
}

// FHE instance cache
let fheInstance: any = null;

// Get the SDK from window (loaded via CDN)
const getSDK = () => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires a browser environment');
  }
  const sdk = window.RelayerSDK || window.relayerSDK;
  if (!sdk) {
    throw new Error('Relayer SDK not loaded. Ensure the CDN script tag is present.');
  }
  return sdk;
};

// Check if SDK is loaded
export const isFHEReady = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.RelayerSDK || window.relayerSDK);
};

// Wait for SDK to be loaded (with timeout)
export const waitForFHE = async (timeoutMs: number = 10000): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (isFHEReady()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
};

export function useFHE() {
  const { address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize FHE instance using the CDN-loaded SDK
  const initFHE = useCallback(async () => {
    if (fheInstance) {
      setIsInitialized(true);
      return fheInstance;
    }

    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    if (typeof window === 'undefined') {
      throw new Error('FHE SDK requires a browser environment');
    }

    // Get the ethereum provider
    const ethereumProvider = window.ethereum || window.okxwallet?.provider || window.okxwallet;
    if (!ethereumProvider) {
      throw new Error('No wallet provider detected. Connect a wallet first.');
    }

    setIsInitializing(true);
    setError(null);

    try {
      // Wait for SDK to be loaded
      const sdkReady = await waitForFHE(10000);
      if (!sdkReady) {
        throw new Error('FHE SDK failed to load from CDN');
      }

      console.log('[FHE] Getting SDK from window...');
      const sdk = getSDK();
      const { initSDK, createInstance, SepoliaConfig } = sdk;

      console.log('[FHE] Initializing SDK...');
      await initSDK();

      console.log('[FHE] Creating instance with SepoliaConfig...');
      const config = { ...SepoliaConfig, network: ethereumProvider };
      fheInstance = await createInstance(config);

      setIsInitialized(true);
      console.log('[FHE] Instance initialized successfully');
      return fheInstance;
    } catch (err) {
      console.error('[FHE] Failed to initialize:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize FHE'));
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, address]);

  // Encrypt a uint32 value for submission
  const encryptUint32 = useCallback(async (value: number): Promise<{
    encryptedAnswer: `0x${string}`;
    inputProof: `0x${string}`;
  }> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const instance = fheInstance || await initFHE();

    const contractAddr = getAddress(CIPHER_PUZZLE_LAB_ADDRESS);
    const userAddr = getAddress(address);

    console.log('[FHE] Creating encrypted input for:', {
      contract: contractAddr,
      user: userAddr,
      value: value,
    });

    // Create input for encryption
    const input = instance.createEncryptedInput(contractAddr, userAddr);

    // Add the uint32 value
    input.add32(value);

    console.log('[FHE] Encrypting input...');
    const { handles, inputProof } = await input.encrypt();
    console.log('[FHE] Encryption complete, handles:', handles.length);

    if (handles.length < 1) {
      throw new Error('FHE SDK returned insufficient handles');
    }

    // Convert Uint8Array to hex strings
    const encryptedAnswer = bytesToHex(handles[0]) as `0x${string}`;
    const proof = bytesToHex(inputProof) as `0x${string}`;

    console.log('[FHE] Encrypted answer:', encryptedAnswer);
    console.log('[FHE] Input proof length:', proof.length);

    return {
      encryptedAnswer,
      inputProof: proof,
    };
  }, [address, initFHE]);

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (address && walletClient && !fheInstance && isFHEReady()) {
      initFHE().catch(console.error);
    }
  }, [address, walletClient, initFHE]);

  return {
    isInitialized,
    isInitializing,
    error,
    initFHE,
    encryptUint32,
    isFHEReady: isFHEReady(),
  };
}
