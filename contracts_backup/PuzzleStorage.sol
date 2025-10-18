// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title PuzzleStorage
 * @notice Storage structures and enums for CipherPuzzleLab
 */
contract PuzzleStorage {
    enum PuzzleStatus {
        Draft,
        Active,
        Paused,
        Ended,
        Revealed,
        Distributed
    }

    enum DifficultyLevel {
        Beginner,
        Intermediate,
        Advanced,
        Expert,
        Master
    }

    enum HintType {
        Range,
        Parity,
        Magnitude,
        Relationship
    }

    struct PuzzleMetadata {
        uint256 puzzleId;
        address creator;
        string title;
        string description;
        euint64 encryptedSolutionCipher;
        euint32 difficultyScoreCipher;
        DifficultyLevel difficulty;
        uint256 prizePool;
        uint256 deadline;
        uint256 createdAt;
        uint256 revealedAt;
        PuzzleStatus status;
        uint32 maxAttempts;
        uint32 totalAttempts;
        uint32 playerCount;
        uint8 availableHints;
        uint64 revealedSolution;
        bool isRevealed;
        uint256 statusChangeCount;
    }

    struct PlayerAttempt {
        uint256 puzzleId;
        address player;
        euint64 encryptedAnswerCipher;
        euint8 accuracyScoreCipher;
        euint16 proximityScoreCipher;
        euint32 timeTakenCipher;
        uint32 attemptNumber;
        uint256 submittedAt;
        uint8 hintsUsed;
        bool isCorrect;
        bool verified;
    }

    struct HintRecord {
        uint256 puzzleId;
        address player;
        HintType hintType;
        euint32 hintValueCipher;
        uint256 purchasedAt;
        uint256 hintCost;
    }

    struct PlayerProfile {
        address player;
        uint256 totalPuzzlesSolved;
        uint256 totalAttemptsUsed;
        uint256 totalPrizesWon;
        euint64 cumulativeAccuracyCipher;
        euint32 averageTimeCipher;
        euint16 skillRatingCipher;
        uint256 firstPuzzleAt;
        uint256 lastPuzzleAt;
        uint256 hintsUsedCount;
    }

    struct LeaderboardEntry {
        address player;
        euint32 totalScoreCipher;
        euint16 accuracyRatingCipher;
        euint32 speedRatingCipher;
        uint32 puzzlesSolved;
        uint32 decryptedTotalScore;
        bool decrypted;
    }

    struct RewardDistribution {
        uint256 puzzleId;
        address[] winners;
        uint256[] prizes;
        uint256 distributedAt;
        uint256 totalDistributed;
        bool completed;
    }

    // State variables
    mapping(uint256 => PuzzleMetadata) internal puzzles;
    mapping(uint256 => mapping(address => PlayerAttempt[])) internal playerAttempts;
    mapping(uint256 => mapping(address => bool)) internal hasParticipated;
    mapping(uint256 => address[]) internal puzzlePlayers;
    mapping(uint256 => mapping(address => HintRecord[])) internal playerHints;
    mapping(address => PlayerProfile) internal playerProfiles;
    mapping(uint256 => mapping(address => LeaderboardEntry)) internal leaderboard;
    mapping(uint256 => address[]) internal leaderboardPlayers;
    mapping(uint256 => RewardDistribution) internal distributions;

    uint256 internal totalPuzzles;
    uint256 internal totalAttempts;
    uint256 internal totalPrizeDistributed;

    euint64 internal aggregatedAccuracy;
    euint32 internal aggregatedSpeed;

    mapping(uint256 => bool) internal decryptionReady;
    mapping(uint256 => uint256) internal decryptionExpiry;
    mapping(uint256 => uint256) internal gatewayRequestToPuzzle;
    mapping(uint256 => address) internal gatewayRequestToPlayer;
    mapping(uint256 => string) internal gatewayRequestType;
}
