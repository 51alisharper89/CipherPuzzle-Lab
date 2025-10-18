// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Gateway} from "@fhevm/solidity/gateway/Gateway.sol";
import {
    FHE,
    ebool,
    euint8,
    euint16,
    euint32,
    euint64,
    euint128,
    externalEuint8,
    externalEuint16,
    externalEuint32,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title CipherPuzzleLab
 * @notice Advanced encrypted puzzle gaming platform with multi-difficulty levels, hint systems, leaderboards, and progressive rewards
 */
contract CipherPuzzleLab is SepoliaConfig {
    address public owner;
    address public puzzleMaster;
    address public rewardManager;
    address public feeCollector;

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

    mapping(uint256 => PuzzleMetadata) private puzzles;
    mapping(uint256 => mapping(address => PlayerAttempt[])) private playerAttempts;
    mapping(uint256 => mapping(address => bool)) private hasParticipated;
    mapping(uint256 => address[]) private puzzlePlayers;
    mapping(uint256 => mapping(address => HintRecord[])) private playerHints;
    mapping(address => PlayerProfile) private playerProfiles;
    mapping(uint256 => mapping(address => LeaderboardEntry)) private leaderboard;
    mapping(uint256 => address[]) private leaderboardPlayers;
    mapping(uint256 => RewardDistribution) private distributions;

    uint256 private totalPuzzles;
    uint256 private totalAttempts;
    uint256 private totalPrizeDistributed;
    uint256 public platformFee = 250; // 2.5% = 250 basis points
    uint256 public hintBaseCost = 0.001 ether;

    euint64 private aggregatedAccuracy;
    euint32 private aggregatedSpeed;

    mapping(uint256 => bool) private decryptionReady;
    mapping(uint256 => uint256) private decryptionExpiry;
    mapping(uint256 => uint256) private gatewayRequestToPuzzle;
    mapping(uint256 => address) private gatewayRequestToPlayer;
    mapping(uint256 => string) private gatewayRequestType;

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

    function createPuzzle(
        uint256 puzzleId,
        string memory title,
        string memory description,
        externalEuint64 encryptedSolution,
        externalEuint32 difficultyScore,
        bytes calldata inputProof,  // Shared proof (FHE best practice)
        DifficultyLevel difficulty,
        uint256 duration,
        uint32 maxAttempts,
        uint8 availableHints
    ) external payable {
        if (puzzles[puzzleId].creator != address(0)) revert PuzzleAlreadyExists();
        if (msg.value < 0.01 ether) revert InsufficientFunds();
        if (duration < 1 hours || duration > 90 days) revert InvalidStatus();
        if (maxAttempts == 0 || maxAttempts > 20) revert InvalidStatus();

        // Both parameters use the same proof (frontend encrypts once)
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
        bytes calldata inputProof  // Shared proof
    ) external {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Active) revert InvalidStatus();
        if (block.timestamp >= puzzle.deadline) revert PuzzleEnded();

        uint32 currentAttempts = uint32(playerAttempts[puzzleId][msg.sender].length);
        if (currentAttempts >= puzzle.maxAttempts) revert MaxAttemptsReached();

        // Both parameters use the same proof
        euint64 answer = FHE.fromExternal(encryptedAnswer, inputProof);
        euint32 time = FHE.fromExternal(timeTaken, inputProof);

        // Check if answer is correct
        ebool isCorrect = FHE.eq(answer, puzzle.encryptedSolutionCipher);

        // Calculate accuracy score (100 if correct, 0 otherwise)
        euint8 accuracyScore = FHE.select(isCorrect, FHE.asEuint8(100), FHE.asEuint8(0));

        // Calculate proximity score (distance from solution)
        ebool answerGreater = FHE.gt(answer, puzzle.encryptedSolutionCipher);
        euint64 distance = FHE.select(
            answerGreater,
            FHE.sub(answer, puzzle.encryptedSolutionCipher),
            FHE.sub(puzzle.encryptedSolutionCipher, answer)
        );

        // Proximity score: inversely proportional to distance (simplified)
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

        // Update player profile
        PlayerProfile storage profile = playerProfiles[msg.sender];
        if (profile.player == address(0)) {
            profile.player = msg.sender;
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
        profile.cumulativeAccuracyCipher = FHE.add(profile.cumulativeAccuracyCipher, FHE.asEuint64(accuracyScore));
        profile.averageTimeCipher = FHE.div(FHE.add(profile.averageTimeCipher, time), uint32(2));

        // Update leaderboard
        _updateLeaderboard(puzzleId, msg.sender, accuracyScore, time);

        aggregatedAccuracy = FHE.add(aggregatedAccuracy, FHE.asEuint64(accuracyScore));
        aggregatedSpeed = FHE.add(aggregatedSpeed, time);

        emit AttemptSubmitted(puzzleId, msg.sender, currentAttempts + 1, hintsUsed);
    }

    function purchaseHint(
        uint256 puzzleId,
        HintType hintType,
        externalEuint32 hintValue,
        bytes calldata inputProof  // Use calldata for gas optimization
    ) external payable {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Active) revert InvalidStatus();
        if (playerHints[puzzleId][msg.sender].length >= puzzle.availableHints) revert InvalidStatus();

        uint256 hintCost = _calculateHintCost(puzzleId, msg.sender);
        if (msg.value < hintCost) revert InsufficientFunds();

        euint32 hint = FHE.fromExternal(hintValue, inputProof);

        HintRecord memory record = HintRecord({
            puzzleId: puzzleId,
            player: msg.sender,
            hintType: hintType,
            hintValueCipher: hint,
            purchasedAt: block.timestamp,
            hintCost: hintCost
        });

        playerHints[puzzleId][msg.sender].push(record);

        FHE.allowThis(hint);
        FHE.allow(hint, msg.sender);

        PlayerProfile storage profile = playerProfiles[msg.sender];
        profile.hintsUsedCount += 1;

        // Return excess payment
        if (msg.value > hintCost) {
            payable(msg.sender).transfer(msg.value - hintCost);
        }

        emit HintPurchased(puzzleId, msg.sender, hintType, hintCost);
    }

    function _calculateHintCost(uint256 puzzleId, address player) internal view returns (uint256) {
        uint256 hintsUsed = playerHints[puzzleId][player].length;
        return hintBaseCost * (2 ** hintsUsed); // Exponential cost increase
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

        // Score calculation: accuracy * 1000 - time penalty
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

    function pausePuzzle(uint256 puzzleId) external onlyPuzzleMaster {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Active) revert InvalidStatus();

        puzzle.status = PuzzleStatus.Paused;
        puzzle.statusChangeCount += 1;

        emit PuzzlePaused(puzzleId);
        emit PuzzleStatusChanged(puzzleId, PuzzleStatus.Active, PuzzleStatus.Paused);
    }

    function resumePuzzle(uint256 puzzleId) external onlyPuzzleMaster {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Paused) revert InvalidStatus();

        puzzle.status = PuzzleStatus.Active;
        puzzle.statusChangeCount += 1;

        emit PuzzleResumed(puzzleId);
        emit PuzzleStatusChanged(puzzleId, PuzzleStatus.Paused, PuzzleStatus.Active);
    }

    function endPuzzle(uint256 puzzleId) external {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (msg.sender != puzzle.creator && msg.sender != puzzleMaster) revert NotAuthorized();
        if (puzzle.status != PuzzleStatus.Active && puzzle.status != PuzzleStatus.Paused) revert InvalidStatus();

        puzzle.status = PuzzleStatus.Ended;
        puzzle.statusChangeCount += 1;
        decryptionReady[puzzleId] = true;
        decryptionExpiry[puzzleId] = block.timestamp + 30 days;

        emit PuzzleStatusChanged(puzzleId, puzzle.status, PuzzleStatus.Ended);
    }

    function requestSolutionReveal(uint256 puzzleId) external returns (uint256) {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Ended) revert InvalidStatus();
        if (puzzle.isRevealed) revert InvalidStatus();

        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(puzzle.encryptedSolutionCipher);

        uint256 requestId = Gateway.requestDecryption(
            cts,
            this.callbackSolutionReveal.selector,
            0,
            block.timestamp + 100,
            false
        );

        gatewayRequestToPuzzle[requestId] = puzzleId;
        gatewayRequestType[requestId] = "solution";

        emit DecryptionRequested(puzzleId, address(0));

        return requestId;
    }

    function callbackSolutionReveal(uint256 requestId, uint64 solution) public onlyGateway {
        uint256 puzzleId = gatewayRequestToPuzzle[requestId];
        PuzzleMetadata storage puzzle = puzzles[puzzleId];

        puzzle.revealedSolution = solution;
        puzzle.isRevealed = true;
        puzzle.revealedAt = block.timestamp;
        puzzle.status = PuzzleStatus.Revealed;
        puzzle.statusChangeCount += 1;

        emit PuzzleRevealed(puzzleId, solution);
        emit PuzzleStatusChanged(puzzleId, PuzzleStatus.Ended, PuzzleStatus.Revealed);
    }

    function requestLeaderboardDecryption(uint256 puzzleId, address player) external returns (uint256) {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Revealed) revert InvalidStatus();

        LeaderboardEntry storage entry = leaderboard[puzzleId][player];
        if (entry.decrypted) revert InvalidStatus();

        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(entry.totalScoreCipher);

        uint256 requestId = Gateway.requestDecryption(
            cts,
            this.callbackLeaderboardDecryption.selector,
            0,
            block.timestamp + 100,
            false
        );

        gatewayRequestToPuzzle[requestId] = puzzleId;
        gatewayRequestToPlayer[requestId] = player;
        gatewayRequestType[requestId] = "leaderboard";

        return requestId;
    }

    function callbackLeaderboardDecryption(uint256 requestId, uint32 totalScore) public onlyGateway {
        uint256 puzzleId = gatewayRequestToPuzzle[requestId];
        address player = gatewayRequestToPlayer[requestId];

        LeaderboardEntry storage entry = leaderboard[puzzleId][player];
        entry.decryptedTotalScore = totalScore;
        entry.decrypted = true;

        emit ScoreDecrypted(puzzleId, player, totalScore);
    }

    function distributeRewards(uint256 puzzleId) external onlyRewardManager {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Revealed) revert InvalidStatus();
        if (distributions[puzzleId].completed) revert AlreadyDistributed();

        address[] memory players = leaderboardPlayers[puzzleId];
        if (players.length == 0) revert NoWinners();

        // Find top 3 players
        address[] memory topPlayers = new address[](3);
        uint32[] memory topScores = new uint32[](3);

        for (uint256 i = 0; i < players.length; i++) {
            LeaderboardEntry storage entry = leaderboard[puzzleId][players[i]];
            if (!entry.decrypted) continue;

            for (uint256 j = 0; j < 3; j++) {
                if (entry.decryptedTotalScore > topScores[j]) {
                    // Shift down
                    for (uint256 k = 2; k > j; k--) {
                        topPlayers[k] = topPlayers[k-1];
                        topScores[k] = topScores[k-1];
                    }
                    topPlayers[j] = players[i];
                    topScores[j] = entry.decryptedTotalScore;
                    break;
                }
            }
        }

        // Distribute: 50% to 1st, 30% to 2nd, 20% to 3rd
        uint256[] memory prizes = new uint256[](3);
        prizes[0] = (puzzle.prizePool * 50) / 100;
        prizes[1] = (puzzle.prizePool * 30) / 100;
        prizes[2] = (puzzle.prizePool * 20) / 100;

        uint256 totalDistributed = 0;
        address[] memory winners = new address[](3);
        uint256 winnerCount = 0;

        for (uint256 i = 0; i < 3; i++) {
            if (topPlayers[i] != address(0) && topScores[i] > 0) {
                payable(topPlayers[i]).transfer(prizes[i]);
                totalDistributed += prizes[i];
                winners[winnerCount] = topPlayers[i];
                winnerCount++;

                PlayerProfile storage profile = playerProfiles[topPlayers[i]];
                profile.totalPuzzlesSolved += 1;
                profile.totalPrizesWon += prizes[i];
                profile.skillRatingCipher = FHE.add(profile.skillRatingCipher, FHE.asEuint16(50));

                emit RewardDistributed(puzzleId, topPlayers[i], prizes[i]);
            }
        }

        distributions[puzzleId] = RewardDistribution({
            puzzleId: puzzleId,
            winners: winners,
            prizes: prizes,
            distributedAt: block.timestamp,
            totalDistributed: totalDistributed,
            completed: true
        });

        puzzle.status = PuzzleStatus.Distributed;
        puzzle.statusChangeCount += 1;
        totalPrizeDistributed += totalDistributed;

        emit PuzzleStatusChanged(puzzleId, PuzzleStatus.Revealed, PuzzleStatus.Distributed);
    }

    function getPuzzleInfo(uint256 puzzleId)
        external
        view
        returns (
            address creator,
            string memory title,
            DifficultyLevel difficulty,
            uint256 prizePool,
            uint256 deadline,
            PuzzleStatus status,
            uint32 playerCount,
            uint32 totalAttempts,
            uint256 statusChangeCount
        )
    {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();

        return (
            puzzle.creator,
            puzzle.title,
            puzzle.difficulty,
            puzzle.prizePool,
            puzzle.deadline,
            puzzle.status,
            puzzle.playerCount,
            puzzle.totalAttempts,
            puzzle.statusChangeCount
        );
    }

    function getPlayerProfile(address player)
        external
        view
        returns (
            uint256 totalPuzzlesSolved,
            uint256 totalAttemptsUsed,
            uint256 totalPrizesWon,
            uint256 hintsUsedCount,
            uint256 firstPuzzleAt,
            uint256 lastPuzzleAt
        )
    {
        PlayerProfile storage profile = playerProfiles[player];
        return (
            profile.totalPuzzlesSolved,
            profile.totalAttemptsUsed,
            profile.totalPrizesWon,
            profile.hintsUsedCount,
            profile.firstPuzzleAt,
            profile.lastPuzzleAt
        );
    }

    function getAttemptCount(uint256 puzzleId, address player) external view returns (uint256) {
        return playerAttempts[puzzleId][player].length;
    }

    function getHintCount(uint256 puzzleId, address player) external view returns (uint256) {
        return playerHints[puzzleId][player].length;
    }

    function getLeaderboardSize(uint256 puzzleId) external view returns (uint256) {
        return leaderboardPlayers[puzzleId].length;
    }

    function getGlobalStatistics() external view returns (uint256, uint256, uint256) {
        return (totalPuzzles, totalAttempts, totalPrizeDistributed);
    }

    function updatePuzzleMaster(address newMaster) external onlyOwner {
        if (newMaster == address(0)) revert InvalidAddress();
        puzzleMaster = newMaster;
        emit PuzzleMasterUpdated(newMaster);
    }

    function updateRewardManager(address newManager) external onlyOwner {
        if (newManager == address(0)) revert InvalidAddress();
        rewardManager = newManager;
        emit RewardManagerUpdated(newManager);
    }

    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Max 10%");
        platformFee = newFee;
    }

    function updateHintBaseCost(uint256 newCost) external onlyOwner {
        hintBaseCost = newCost;
    }

    function updateFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert InvalidAddress();
        feeCollector = newCollector;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }
}
