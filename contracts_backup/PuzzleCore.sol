// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Gateway} from "@fhevm/solidity/gateway/Gateway.sol";
import {FHE, ebool, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import "./PuzzleEvents.sol";

/**
 * @title PuzzleCore
 * @notice Core puzzle creation and attempt submission logic
 */
contract PuzzleCore is PuzzleEvents, SepoliaConfig {
    address public owner;
    address public puzzleMaster;
    address public rewardManager;
    address public feeCollector;

    uint256 public platformFee = 250; // 2.5% = 250 basis points
    uint256 public hintBaseCost = 0.001 ether;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyPuzzleMaster() {
        if (msg.sender != puzzleMaster) revert NotPuzzleMaster();
        _;
    }

    modifier onlyRewardManager() {
        if (msg.sender != rewardManager) revert NotRewardManager();
        _;
    }

    modifier onlyGateway() {
        if (msg.sender != Gateway.gatewayContractAddress()) revert NotAuthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        puzzleMaster = msg.sender;
        rewardManager = msg.sender;
        feeCollector = msg.sender;

        aggregatedAccuracy = FHE.asEuint64(0);
        aggregatedSpeed = FHE.asEuint32(0);
        FHE.allowThis(aggregatedAccuracy);
        FHE.allowThis(aggregatedSpeed);
    }

    function createPuzzle(
        uint256 puzzleId,
        string memory title,
        string memory description,
        externalEuint64 encryptedSolution,
        externalEuint32 difficultyScore,
        bytes calldata inputProof,
        DifficultyLevel difficulty,
        uint256 duration,
        uint32 maxAttempts,
        uint8 availableHints
    ) external payable {
        if (puzzles[puzzleId].creator != address(0)) revert PuzzleAlreadyExists();
        if (msg.value < 0.01 ether) revert InsufficientFunds();
        if (duration < 1 hours || duration > 90 days) revert InvalidStatus();
        if (maxAttempts == 0 || maxAttempts > 20) revert InvalidStatus();

        euint64 solution = FHE.fromExternal(encryptedSolution, inputProof);
        euint32 diffScore = FHE.fromExternal(difficultyScore, inputProof);

        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 prizePool = msg.value - fee;

        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        puzzle.puzzleId = puzzleId;
        puzzle.creator = msg.sender;
        puzzle.title = title;
        puzzle.description = description;
        puzzle.encryptedSolutionCipher = solution;
        puzzle.difficultyScoreCipher = diffScore;
        puzzle.difficulty = difficulty;
        puzzle.prizePool = prizePool;
        puzzle.deadline = block.timestamp + duration;
        puzzle.createdAt = block.timestamp;
        puzzle.status = PuzzleStatus.Draft;
        puzzle.maxAttempts = maxAttempts;
        puzzle.totalAttempts = 0;
        puzzle.playerCount = 0;
        puzzle.availableHints = availableHints;
        puzzle.isRevealed = false;
        puzzle.statusChangeCount = 1;

        FHE.allowThis(solution);
        FHE.allowThis(diffScore);

        if (fee > 0) {
            payable(feeCollector).transfer(fee);
        }

        totalPuzzles += 1;
        decryptionReady[puzzleId] = false;

        emit PuzzleCreated(puzzleId, msg.sender, title, difficulty, prizePool);
        emit PuzzleStatusChanged(puzzleId, PuzzleStatus.Draft, PuzzleStatus.Draft);
    }

    function activatePuzzle(uint256 puzzleId) external onlyPuzzleMaster {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Draft) revert InvalidStatus();

        puzzle.status = PuzzleStatus.Active;
        puzzle.statusChangeCount += 1;

        emit PuzzleStatusChanged(puzzleId, PuzzleStatus.Draft, PuzzleStatus.Active);
    }

    function submitAttempt(
        uint256 puzzleId,
        externalEuint64 encryptedAnswer,
        externalEuint32 timeTaken,
        bytes calldata inputProof
    ) external {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Active) revert InvalidStatus();
        if (block.timestamp >= puzzle.deadline) revert PuzzleEnded();

        uint32 currentAttempts = uint32(playerAttempts[puzzleId][msg.sender].length);
        if (currentAttempts >= puzzle.maxAttempts) revert MaxAttemptsReached();

        euint64 answer = FHE.fromExternal(encryptedAnswer, inputProof);
        euint32 time = FHE.fromExternal(timeTaken, inputProof);

        ebool isCorrect = FHE.eq(answer, puzzle.encryptedSolutionCipher);
        euint8 accuracyScore = FHE.select(isCorrect, FHE.asEuint8(100), FHE.asEuint8(0));

        ebool answerGreater = FHE.gt(answer, puzzle.encryptedSolutionCipher);
        euint64 distance = FHE.select(
            answerGreater,
            FHE.sub(answer, puzzle.encryptedSolutionCipher),
            FHE.sub(puzzle.encryptedSolutionCipher, answer)
        );

        euint16 proximityScore = FHE.asEuint16(FHE.div(distance, uint64(100)));

        uint8 hintsUsed = uint8(playerHints[puzzleId][msg.sender].length);

        PlayerAttempt memory attempt = PlayerAttempt({
            puzzleId: puzzleId,
            player: msg.sender,
            encryptedAnswerCipher: answer,
            accuracyScoreCipher: accuracyScore,
            proximityScoreCipher: proximityScore,
            timeTakenCipher: time,
            attemptNumber: currentAttempts + 1,
            submittedAt: block.timestamp,
            hintsUsed: hintsUsed,
            isCorrect: false,
            verified: false
        });

        playerAttempts[puzzleId][msg.sender].push(attempt);

        if (!hasParticipated[puzzleId][msg.sender]) {
            puzzlePlayers[puzzleId].push(msg.sender);
            hasParticipated[puzzleId][msg.sender] = true;
            puzzle.playerCount += 1;
        }

        puzzle.totalAttempts += 1;
        totalAttempts += 1;

        FHE.allowThis(answer);
        FHE.allowThis(accuracyScore);
        FHE.allowThis(proximityScore);
        FHE.allowThis(time);

        _updatePlayerProfile(msg.sender, accuracyScore, time);
        _updateLeaderboard(puzzleId, msg.sender, accuracyScore, time);

        aggregatedAccuracy = FHE.add(aggregatedAccuracy, FHE.asEuint64(accuracyScore));
        aggregatedSpeed = FHE.add(aggregatedSpeed, time);

        emit AttemptSubmitted(puzzleId, msg.sender, currentAttempts + 1, hintsUsed);
    }

    function _updatePlayerProfile(address player, euint8 accuracy, euint32 time) internal {
        PlayerProfile storage profile = playerProfiles[player];
        if (profile.player == address(0)) {
            profile.player = player;
            profile.firstPuzzleAt = block.timestamp;
            profile.cumulativeAccuracyCipher = FHE.asEuint64(0);
            profile.averageTimeCipher = FHE.asEuint32(0);
            profile.skillRatingCipher = FHE.asEuint16(500);
            FHE.allowThis(profile.cumulativeAccuracyCipher);
            FHE.allowThis(profile.averageTimeCipher);
            FHE.allowThis(profile.skillRatingCipher);
        }
        profile.totalAttemptsUsed += 1;
        profile.lastPuzzleAt = block.timestamp;
        profile.cumulativeAccuracyCipher = FHE.add(profile.cumulativeAccuracyCipher, FHE.asEuint64(accuracy));
        profile.averageTimeCipher = FHE.div(FHE.add(profile.averageTimeCipher, time), uint32(2));
    }

    function _updateLeaderboard(uint256 puzzleId, address player, euint8 accuracy, euint32 time) internal {
        LeaderboardEntry storage entry = leaderboard[puzzleId][player];

        if (entry.player == address(0)) {
            entry.player = player;
            entry.totalScoreCipher = FHE.asEuint32(0);
            entry.accuracyRatingCipher = FHE.asEuint16(0);
            entry.speedRatingCipher = FHE.asEuint32(0);
            entry.puzzlesSolved = 0;
            entry.decrypted = false;
            leaderboardPlayers[puzzleId].push(player);
        }

        euint32 attemptScore = FHE.mul(FHE.asEuint32(accuracy), uint32(1000));
        euint32 timePenalty = FHE.div(time, uint32(10));
        euint32 netScore = FHE.sub(attemptScore, timePenalty);

        entry.totalScoreCipher = FHE.add(entry.totalScoreCipher, netScore);
        entry.accuracyRatingCipher = FHE.add(entry.accuracyRatingCipher, FHE.asEuint16(accuracy));
        entry.speedRatingCipher = FHE.add(entry.speedRatingCipher, time);

        FHE.allowThis(entry.totalScoreCipher);
        FHE.allowThis(entry.accuracyRatingCipher);
        FHE.allowThis(entry.speedRatingCipher);

        emit LeaderboardUpdated(puzzleId, player);
    }
}
