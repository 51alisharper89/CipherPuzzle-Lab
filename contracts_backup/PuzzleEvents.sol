// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PuzzleStorage.sol";

/**
 * @title PuzzleEvents
 * @notice Events for CipherPuzzleLab
 */
contract PuzzleEvents is PuzzleStorage {
    event PuzzleCreated(uint256 indexed puzzleId, address indexed creator, string title, DifficultyLevel difficulty, uint256 prizePool);
    event PuzzleStatusChanged(uint256 indexed puzzleId, PuzzleStatus oldStatus, PuzzleStatus newStatus);
    event AttemptSubmitted(uint256 indexed puzzleId, address indexed player, uint32 attemptNumber, uint8 hintsUsed);
    event HintPurchased(uint256 indexed puzzleId, address indexed player, HintType hintType, uint256 cost);
    event PuzzleRevealed(uint256 indexed puzzleId, uint64 solution);
    event RewardDistributed(uint256 indexed puzzleId, address indexed winner, uint256 amount);
    event LeaderboardUpdated(uint256 indexed puzzleId, address indexed player);
    event DecryptionRequested(uint256 indexed puzzleId, address indexed player);
    event ScoreDecrypted(uint256 indexed puzzleId, address indexed player, uint32 totalScore);
    event PuzzlePaused(uint256 indexed puzzleId);
    event PuzzleResumed(uint256 indexed puzzleId);
    event PuzzleMasterUpdated(address indexed newMaster);
    event RewardManagerUpdated(address indexed newManager);

    error PuzzleNotFound();
    error PuzzleAlreadyExists();
    error InvalidStatus();
    error InvalidAddress();
    error NotOwner();
    error NotPuzzleMaster();
    error NotRewardManager();
    error NotAuthorized();
    error PuzzleEnded();
    error MaxAttemptsReached();
    error InsufficientFunds();
    error NoWinners();
    error AlreadyDistributed();
}
