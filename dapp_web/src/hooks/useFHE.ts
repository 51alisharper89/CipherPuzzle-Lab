import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { initializeFHE } from '../utils/fhe';

export interface UseFHEReturn {
  fhe: any | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * React hook for FHE SDK lifecycle management
 * Automatically initializes on wallet connection and network switch
 */
export function useFHE(): UseFHEReturn {
  const [fhe, setFhe] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const refresh = () => {
    setIsInitialized(false);
    setFhe(null);
    setError(null);
  };

  useEffect(() => {
    if (!isConnected || !address) {
      setIsInitialized(false);
      setFhe(null);
      setError(null);
      return;
    }

    if (chainId !== 11155111) { // Sepolia chainId
      setError('Please switch to Sepolia testnet');
      setIsInitialized(false);
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    (async () => {
      if (!mounted) return;

      setIsLoading(true);
      setError(null);

      try {
        const instance = await initializeFHE();

        if (mounted && !controller.signal.aborted) {
          setFhe(instance);
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        if (mounted && !controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize FHE');
          setIsInitialized(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [isConnected, address, chainId]);

  return { fhe, isInitialized, isLoading, error, refresh };
}
