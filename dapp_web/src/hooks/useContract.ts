import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CIPHER_PUZZLE_LAB_ADDRESS, CIPHER_PUZZLE_LAB_ABI } from '../config/contract';

// Read Hooks
export function useGetPuzzleInfo(puzzleId: bigint) {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzleInfo',
    args: [puzzleId],
  });
}

export function useGetPlayerProfile(playerAddress: string) {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPlayerProfile',
    args: [playerAddress as `0x${string}`],
  });
}

export function useGetGlobalStatistics() {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getGlobalStatistics',
  });
}

export function useGetAttemptCount(puzzleId: bigint, playerAddress: string) {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getAttemptCount',
    args: [puzzleId, playerAddress as `0x${string}`],
  });
}

export function useGetHintCount(puzzleId: bigint, playerAddress: string) {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getHintCount',
    args: [puzzleId, playerAddress as `0x${string}`],
  });
}

export function useGetLeaderboardSize(puzzleId: bigint) {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getLeaderboardSize',
    args: [puzzleId],
  });
}

// Write Hooks
export function useCreatePuzzle() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPuzzle = (params: {
    puzzleId: bigint;
    title: string;
    description: string;
    encryptedSolution: string;
    difficultyScore: string;
    inputProof: string;
    difficulty: number;
    duration: number;
    maxAttempts: number;
    availableHints: number;
    value: bigint;
  }) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'createPuzzle',
      args: [
        params.puzzleId,
        params.title,
        params.description,
        params.encryptedSolution as `0x${string}`,
        params.difficultyScore as `0x${string}`,
        params.inputProof as `0x${string}`,
        params.difficulty,
        params.duration,
        params.maxAttempts,
        params.availableHints,
      ],
      value: params.value,
    });
  };

  return { createPuzzle, hash, error, isPending, isConfirming, isSuccess };
}

export function useSubmitAttempt() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitAttempt = (params: {
    puzzleId: bigint;
    encryptedAnswer: string;
    timeTaken: string;
    inputProof: string;
  }) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'submitAttempt',
      args: [
        params.puzzleId,
        params.encryptedAnswer as `0x${string}`,
        params.timeTaken as `0x${string}`,
        params.inputProof as `0x${string}`,
      ],
    });
  };

  return { submitAttempt, hash, error, isPending, isConfirming, isSuccess };
}

export function usePurchaseHint() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const purchaseHint = (params: {
    puzzleId: bigint;
    hintType: number;
    hintValue: string;
    inputProof: string;
    value: bigint;
  }) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'purchaseHint',
      args: [
        params.puzzleId,
        params.hintType,
        params.hintValue as `0x${string}`,
        params.inputProof as `0x${string}`,
      ],
      value: params.value,
    });
  };

  return { purchaseHint, hash, error, isPending, isConfirming, isSuccess };
}

export function useActivatePuzzle() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const activatePuzzle = (puzzleId: bigint) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'activatePuzzle',
      args: [puzzleId],
    });
  };

  return { activatePuzzle, hash, error, isPending, isConfirming, isSuccess };
}

export function useEndPuzzle() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const endPuzzle = (puzzleId: bigint) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'endPuzzle',
      args: [puzzleId],
    });
  };

  return { endPuzzle, hash, error, isPending, isConfirming, isSuccess };
}

export function useRequestSolutionReveal() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const requestReveal = (puzzleId: bigint) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'requestSolutionReveal',
      args: [puzzleId],
    });
  };

  return { requestReveal, hash, error, isPending, isConfirming, isSuccess };
}

export function useRequestLeaderboardDecryption() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const requestDecryption = (puzzleId: bigint, playerAddress: string) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'requestLeaderboardDecryption',
      args: [puzzleId, playerAddress as `0x${string}`],
    });
  };

  return { requestDecryption, hash, error, isPending, isConfirming, isSuccess };
}

export function useDistributeRewards() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const distributeRewards = (puzzleId: bigint) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'distributeRewards',
      args: [puzzleId],
    });
  };

  return { distributeRewards, hash, error, isPending, isConfirming, isSuccess };
}
