import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CIPHER_PUZZLE_LAB_ADDRESS, CIPHER_PUZZLE_LAB_ABI } from '../config/contract';

// Read Hooks
export function useGetPuzzle(puzzleId: bigint) {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [puzzleId],
  });
}

export function useGetPlayerPoints(playerAddress: `0x${string}`) {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPlayerPoints',
    args: [playerAddress],
  });
}

export function useGetTotalPuzzles() {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'totalPuzzles',
  });
}

export function useGetTotalSolvers() {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'totalSolvers',
  });
}

export function useGetTotalPlayers() {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getTotalPlayers',
  });
}

export function useGetTopPlayers(count: bigint) {
  return useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getTopPlayers',
    args: [count],
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
      ],
      value: params.value,
    } as const as any);
  };

  return { createPuzzle, hash, error, isPending, isConfirming, isSuccess };
}

// FHE-enabled solution submission
export function useSubmitSolution() {
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitSolution = (params: {
    puzzleId: bigint;
    encryptedAnswer: `0x${string}`;  // bytes32 - encrypted answer
    inputProof: `0x${string}`;        // bytes - FHE input proof
  }) => {
    writeContract({
      address: CIPHER_PUZZLE_LAB_ADDRESS,
      abi: CIPHER_PUZZLE_LAB_ABI,
      functionName: 'submitSolution',
      args: [
        params.puzzleId,
        params.encryptedAnswer,
        params.inputProof,
      ],
    } as const as any);
  };

  return { submitSolution, hash, error, isPending, isConfirming, isSuccess };
}
