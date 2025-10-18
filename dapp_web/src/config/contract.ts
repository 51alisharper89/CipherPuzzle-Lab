// Contract configuration and ABI

export const CIPHER_PUZZLE_LAB_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Enums matching contract
export enum PuzzleStatus {
  Draft,
  Active,
  Paused,
  Ended,
  Revealed,
  Distributed
}

export enum DifficultyLevel {
  Beginner,
  Intermediate,
  Advanced,
  Expert,
  Master
}

export enum HintType {
  Range,
  Parity,
  Magnitude,
  Relationship
}

// Contract ABI - Updated for modular V2 contract
export const CIPHER_PUZZLE_LAB_ABI = [
  // Puzzle Management
  'function createPuzzle(uint256 puzzleId, string memory title, string memory description, bytes32 encryptedSolution, bytes32 difficultyScore, bytes calldata inputProof, uint8 difficulty, uint256 duration, uint32 maxAttempts, uint8 availableHints) external payable',
  'function activatePuzzle(uint256 puzzleId) external',
  'function pausePuzzle(uint256 puzzleId) external',
  'function resumePuzzle(uint256 puzzleId) external',
  'function endPuzzle(uint256 puzzleId) external',

  // Player Actions
  'function submitAttempt(uint256 puzzleId, bytes32 encryptedAnswer, bytes32 timeTaken, bytes calldata inputProof) external',
  'function purchaseHint(uint256 puzzleId, uint8 hintType, bytes32 hintValue, bytes calldata inputProof) external payable',

  // Decryption & Rewards
  'function requestSolutionReveal(uint256 puzzleId) external returns (uint256)',
  'function requestLeaderboardDecryption(uint256 puzzleId, address player) external returns (uint256)',
  'function distributeRewards(uint256 puzzleId) external',

  // View Functions
  'function getPuzzleInfo(uint256 puzzleId) external view returns (address creator, string memory title, uint8 difficulty, uint256 prizePool, uint256 deadline, uint8 status, uint32 playerCount, uint32 totalAttempts, uint256 statusChangeCount)',
  'function getPlayerProfile(address player) external view returns (uint256 totalPuzzlesSolved, uint256 totalAttemptsUsed, uint256 totalPrizesWon, uint256 hintsUsedCount, uint256 firstPuzzleAt, uint256 lastPuzzleAt)',
  'function getAttemptCount(uint256 puzzleId, address player) external view returns (uint256)',
  'function getHintCount(uint256 puzzleId, address player) external view returns (uint256)',
  'function getLeaderboardSize(uint256 puzzleId) external view returns (uint256)',
  'function getGlobalStatistics() external view returns (uint256 totalPuzzles, uint256 totalAttempts, uint256 totalPrizeDistributed)',

  // Admin Functions
  'function updatePuzzleMaster(address newMaster) external',
  'function updateRewardManager(address newManager) external',
  'function updatePlatformFee(uint256 newFee) external',
  'function updateHintBaseCost(uint256 newCost) external',
  'function updateFeeCollector(address newCollector) external',
  'function transferOwnership(address newOwner) external',

  // State Variables
  'function owner() external view returns (address)',
  'function puzzleMaster() external view returns (address)',
  'function rewardManager() external view returns (address)',
  'function feeCollector() external view returns (address)',
  'function platformFee() external view returns (uint256)',
  'function hintBaseCost() external view returns (uint256)',

  // Events
  'event PuzzleCreated(uint256 indexed puzzleId, address indexed creator, string title, uint8 difficulty, uint256 prizePool)',
  'event PuzzleStatusChanged(uint256 indexed puzzleId, uint8 oldStatus, uint8 newStatus)',
  'event AttemptSubmitted(uint256 indexed puzzleId, address indexed player, uint32 attemptNumber, uint8 hintsUsed)',
  'event HintPurchased(uint256 indexed puzzleId, address indexed player, uint8 hintType, uint256 cost)',
  'event PuzzleRevealed(uint256 indexed puzzleId, uint64 solution)',
  'event RewardDistributed(uint256 indexed puzzleId, address indexed winner, uint256 amount)',
  'event LeaderboardUpdated(uint256 indexed puzzleId, address indexed player)',
  'event DecryptionRequested(uint256 indexed puzzleId, address indexed player)',
  'event ScoreDecrypted(uint256 indexed puzzleId, address indexed player, uint32 totalScore)',
  'event PuzzlePaused(uint256 indexed puzzleId)',
  'event PuzzleResumed(uint256 indexed puzzleId)',
] as const;

// TypeScript interfaces
export interface PuzzleInfo {
  creator: string;
  title: string;
  difficulty: DifficultyLevel;
  prizePool: bigint;
  deadline: bigint;
  status: PuzzleStatus;
  playerCount: number;
  totalAttempts: number;
  statusChangeCount: bigint;
}

export interface PlayerProfile {
  totalPuzzlesSolved: bigint;
  totalAttemptsUsed: bigint;
  totalPrizesWon: bigint;
  hintsUsedCount: bigint;
  firstPuzzleAt: bigint;
  lastPuzzleAt: bigint;
}

export interface GlobalStatistics {
  totalPuzzles: bigint;
  totalAttempts: bigint;
  totalPrizeDistributed: bigint;
}

export interface CreatePuzzleParams {
  puzzleId: bigint;
  title: string;
  description: string;
  solution: bigint;
  difficultyScore: number;
  difficulty: DifficultyLevel;
  durationInDays: number;
  maxAttempts: number;
  availableHints: number;
  prizePoolInEth: string;
}

export interface SubmitAttemptParams {
  puzzleId: bigint;
  answer: bigint;
  timeTakenInSeconds: number;
}

export interface PurchaseHintParams {
  puzzleId: bigint;
  hintType: HintType;
  hintValue: number;
  paymentInEth: string;
}
