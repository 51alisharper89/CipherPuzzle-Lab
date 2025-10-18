import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseEther } from 'ethers';
import { useFHE } from './useFHE';
import { useCreatePuzzle, useSubmitAttempt, usePurchaseHint } from './useContract';
import { encryptPuzzleData, encryptAttemptData, encryptUint32 } from '../utils/fhe';
import { CIPHER_PUZZLE_LAB_ADDRESS, CreatePuzzleParams, SubmitAttemptParams, PurchaseHintParams } from '../config/contract';

/**
 * High-level hook for creating encrypted puzzles
 * Handles FHE encryption automatically
 */
export function useCreateEncryptedPuzzle() {
  const { address } = useAccount();
  const { isInitialized } = useFHE();
  const { createPuzzle, hash, error, isPending, isConfirming, isSuccess } = useCreatePuzzle();

  const create = useCallback(async (params: CreatePuzzleParams) => {
    if (!address || !isInitialized) {
      throw new Error('Wallet not connected or FHE not initialized');
    }

    // Encrypt all parameters at once (shared proof)
    const { handles, inputProof } = await encryptPuzzleData(
      params.solution,
      params.difficultyScore,
      CIPHER_PUZZLE_LAB_ADDRESS,
      address
    );

    createPuzzle({
      puzzleId: params.puzzleId,
      title: params.title,
      description: params.description,
      encryptedSolution: handles[0],      // externalEuint64
      difficultyScore: handles[1],        // externalEuint32
      inputProof,                         // bytes (shared proof)
      difficulty: params.difficulty,
      duration: params.durationInDays * 24 * 60 * 60,
      maxAttempts: params.maxAttempts,
      availableHints: params.availableHints,
      value: parseEther(params.prizePoolInEth),
    });
  }, [address, isInitialized, createPuzzle]);

  return { create, hash, error, isLoading: isPending || isConfirming, isSuccess };
}

/**
 * High-level hook for submitting encrypted attempts
 * Handles FHE encryption automatically
 */
export function useSubmitEncryptedAttempt() {
  const { address } = useAccount();
  const { isInitialized } = useFHE();
  const { submitAttempt, hash, error, isPending, isConfirming, isSuccess } = useSubmitAttempt();

  const submit = useCallback(async (params: SubmitAttemptParams) => {
    if (!address || !isInitialized) {
      throw new Error('Wallet not connected or FHE not initialized');
    }

    // Encrypt all parameters at once (shared proof)
    const { handles, inputProof } = await encryptAttemptData(
      params.answer,
      params.timeTakenInSeconds,
      CIPHER_PUZZLE_LAB_ADDRESS,
      address
    );

    submitAttempt({
      puzzleId: params.puzzleId,
      encryptedAnswer: handles[0],   // externalEuint64
      timeTaken: handles[1],          // externalEuint32
      inputProof,                     // bytes (shared proof)
    });
  }, [address, isInitialized, submitAttempt]);

  return { submit, hash, error, isLoading: isPending || isConfirming, isSuccess };
}

/**
 * High-level hook for purchasing encrypted hints
 * Handles FHE encryption automatically
 */
export function usePurchaseEncryptedHint() {
  const { address } = useAccount();
  const { isInitialized } = useFHE();
  const { purchaseHint, hash, error, isPending, isConfirming, isSuccess } = usePurchaseHint();

  const purchase = useCallback(async (params: PurchaseHintParams) => {
    if (!address || !isInitialized) {
      throw new Error('Wallet not connected or FHE not initialized');
    }

    // Encrypt hint value
    const { handle, proof } = await encryptUint32(
      params.hintValue,
      CIPHER_PUZZLE_LAB_ADDRESS,
      address
    );

    purchaseHint({
      puzzleId: params.puzzleId,
      hintType: params.hintType,
      hintValue: handle,             // externalEuint32
      inputProof: proof,             // bytes
      value: parseEther(params.paymentInEth),
    });
  }, [address, isInitialized, purchaseHint]);

  return { purchase, hash, error, isLoading: isPending || isConfirming, isSuccess };
}
