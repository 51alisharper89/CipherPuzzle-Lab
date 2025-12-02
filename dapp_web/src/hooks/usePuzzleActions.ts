import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useCreatePuzzle, useSubmitSolution } from './useContract';
import { useFHE } from './useFHE';
import {
  toastTxPending,
  toastTxSuccess,
  toastTxError,
  toastUserRejected,
  toastWarning,
} from '../lib/toast-utils';

/**
 * High-level hook for creating puzzles with toast notifications
 */
export function useCreatePuzzleWithToast() {
  const { address } = useAccount();
  const { createPuzzle, hash, error, isPending, isConfirming, isSuccess } = useCreatePuzzle();
  const pendingToastShown = useRef(false);

  // Show pending toast when hash is received
  useEffect(() => {
    if (hash && !pendingToastShown.current) {
      pendingToastShown.current = true;
      toastTxPending(hash);
    }
  }, [hash]);

  // Show success toast
  useEffect(() => {
    if (isSuccess && hash) {
      toastTxSuccess(hash, 'Puzzle Created Successfully!');
      pendingToastShown.current = false;
    }
  }, [isSuccess, hash]);

  // Show error toast
  useEffect(() => {
    if (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('User rejected') || errorMsg.includes('user rejected')) {
        toastUserRejected();
      } else {
        toastTxError(hash, error);
      }
      pendingToastShown.current = false;
    }
  }, [error, hash]);

  const create = useCallback((params: {
    puzzleId: bigint;
    title: string;
    description: string;
    rewardInWei: bigint;
  }) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    pendingToastShown.current = false;

    createPuzzle({
      puzzleId: params.puzzleId,
      title: params.title,
      description: params.description,
      value: params.rewardInWei,
    });
  }, [address, createPuzzle]);

  return { create, hash, error, isLoading: isPending || isConfirming, isSuccess };
}

/**
 * High-level hook for submitting solutions with FHE encryption and toast notifications
 */
export function useSubmitSolutionWithToast() {
  const { address } = useAccount();
  const { submitSolution, hash, error, isPending, isConfirming, isSuccess } = useSubmitSolution();
  const { encryptUint32, isInitialized: fheInitialized, isInitializing: fheInitializing, initFHE } = useFHE();
  const pendingToastShown = useRef(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Show pending toast when hash is received
  useEffect(() => {
    if (hash && !pendingToastShown.current) {
      pendingToastShown.current = true;
      toastTxPending(hash);
    }
  }, [hash]);

  // Show success toast
  useEffect(() => {
    if (isSuccess && hash) {
      toastTxSuccess(hash, 'Answer Submitted Successfully!');
      pendingToastShown.current = false;
    }
  }, [isSuccess, hash]);

  // Show error toast
  useEffect(() => {
    if (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('User rejected') || errorMsg.includes('user rejected')) {
        toastUserRejected();
      } else {
        toastTxError(hash, error);
      }
      pendingToastShown.current = false;
    }
  }, [error, hash]);

  const submit = useCallback(async (params: {
    puzzleId: bigint;
    answer: number;  // Now takes raw number, we encrypt it
  }) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    pendingToastShown.current = false;
    setIsEncrypting(true);

    try {
      // Initialize FHE if not already done
      if (!fheInitialized) {
        await initFHE();
      }

      console.log('Encrypting answer with FHE...');

      // Encrypt the answer using FHE
      const { encryptedAnswer, inputProof } = await encryptUint32(params.answer);

      console.log('Answer encrypted, submitting to blockchain...');

      // Submit the encrypted answer
      submitSolution({
        puzzleId: params.puzzleId,
        encryptedAnswer,
        inputProof,
      });
    } catch (err) {
      console.error('FHE encryption error:', err);
      toastWarning('Encryption Error', err instanceof Error ? err.message : 'Failed to encrypt answer');
      throw err;
    } finally {
      setIsEncrypting(false);
    }
  }, [address, submitSolution, encryptUint32, fheInitialized, initFHE]);

  return {
    submit,
    hash,
    error,
    isLoading: isPending || isConfirming || isEncrypting || fheInitializing,
    isEncrypting,
    isSuccess
  };
}
