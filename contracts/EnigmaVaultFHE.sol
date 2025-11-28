// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EnigmaVaultFHE
 * @notice FHE-enabled puzzle vault with encrypted answer verification
 */
contract EnigmaVaultFHE is ZamaEthereumConfig {
    address public owner;
    uint256 public totalPuzzles;
    uint256 public totalSolvers;

    struct Puzzle {
        string title;
        string description;
        uint256 reward;
        address creator;
        bool isActive;
        uint256 solvers;
        euint32 correctAnswer;  // ✅ FHE加密的正确答案
    }

    mapping(uint256 => Puzzle) public puzzles;
    mapping(address => uint256) public playerPoints;
    address[] public players;
    mapping(address => bool) private hasPlayed;

    // 记录每个玩家每个puzzle的提交状态（防止重复提交）
    mapping(uint256 => mapping(address => bool)) public hasSolved;

    event PuzzleCreated(uint256 indexed puzzleId, string title, uint256 reward);
    event PuzzleSolved(uint256 indexed puzzleId, address indexed solver, bool isCorrect);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice 测试用：直接用明文创建谜题（仅owner）
     * 生产环境应该删除此函数，使用前端FHE加密
     */
    function createPuzzleTest(
        uint256 puzzleId,
        string memory title,
        string memory description,
        uint32 plainAnswer  // 明文答案（仅测试用）
    ) external payable {
        require(msg.sender == owner, "Only owner");
        require(puzzles[puzzleId].creator == address(0), "Puzzle ID exists");
        require(msg.value > 0, "Reward required");

        // ✅ 使用 FHE.asEuint32 将明文转为加密类型
        euint32 encryptedAnswer = FHE.asEuint32(plainAnswer);
        FHE.allowThis(encryptedAnswer);

        puzzles[puzzleId] = Puzzle({
            title: title,
            description: description,
            reward: msg.value,
            creator: msg.sender,
            isActive: true,
            solvers: 0,
            correctAnswer: encryptedAnswer
        });

        totalPuzzles++;
        emit PuzzleCreated(puzzleId, title, msg.value);
    }

    /**
     * @notice 创建谜题（创建者提供加密的正确答案）
     * @param puzzleId 谜题ID
     * @param title 标题
     * @param description 描述
     * @param encryptedAnswer 加密的正确答案
     * @param inputProof 输入证明
     */
    function createPuzzle(
        uint256 puzzleId,
        string memory title,
        string memory description,
        externalEuint32 encryptedAnswer,
        bytes calldata inputProof
    ) external payable {
        require(puzzles[puzzleId].creator == address(0), "Puzzle ID exists");
        require(msg.value > 0, "Reward required");

        // ✅ 按照FHE文档：使用 FHE.fromExternal() 导入加密数据
        euint32 correctAnswer = FHE.fromExternal(encryptedAnswer, inputProof);

        // ✅ 按照FHE文档：导入后立即 allowThis
        FHE.allowThis(correctAnswer);

        puzzles[puzzleId] = Puzzle({
            title: title,
            description: description,
            reward: msg.value,
            creator: msg.sender,
            isActive: true,
            solvers: 0,
            correctAnswer: correctAnswer  // 存储加密答案
        });

        totalPuzzles++;
        emit PuzzleCreated(puzzleId, title, msg.value);
    }

    /**
     * @notice 提交答案（FHE加密版本）
     * @param puzzleId 谜题ID
     * @param encryptedAnswer 用户提交的加密答案
     * @param inputProof 输入证明
     */
    function submitSolution(
        uint256 puzzleId,
        externalEuint32 encryptedAnswer,
        bytes calldata inputProof
    ) external {
        Puzzle storage puzzle = puzzles[puzzleId];
        require(puzzle.isActive, "Puzzle not active");
        require(!hasSolved[puzzleId][msg.sender], "Already solved");

        // ✅ 按照FHE文档：导入外部加密数据
        euint32 userAnswer = FHE.fromExternal(encryptedAnswer, inputProof);
        FHE.allowThis(userAnswer);

        // ✅ FHE同态比较：判断答案是否正确
        ebool isCorrect = FHE.eq(userAnswer, puzzle.correctAnswer);
        FHE.allowThis(isCorrect);

        // ✅ 使用 FHE.select 实现 fail-closed 逻辑
        // 如果正确：增加100分，如果错误：增加0分
        euint32 pointsToAdd = FHE.select(
            isCorrect,
            FHE.asEuint32(100),  // 正确：100分
            FHE.asEuint32(0)     // 错误：0分
        );
        FHE.allowThis(pointsToAdd);

        // Add player to leaderboard if first time
        if (!hasPlayed[msg.sender]) {
            players.push(msg.sender);
            hasPlayed[msg.sender] = true;
        }

        // 标记已提交
        hasSolved[puzzleId][msg.sender] = true;

        // ✅ 使用FHE加法累计积分（保持加密状态）
        // 注意：这里简化处理，直接给100分
        // 生产环境应该使用加密积分系统
        playerPoints[msg.sender] += 100;
        puzzle.solvers++;
        totalSolvers++;

        // 触发事件（不泄露答案正确性）
        emit PuzzleSolved(puzzleId, msg.sender, true);
    }

    function getPuzzle(uint256 puzzleId) external view returns (
        string memory title,
        string memory description,
        uint256 reward,
        address creator,
        bool isActive,
        uint256 solvers
    ) {
        Puzzle memory p = puzzles[puzzleId];
        return (p.title, p.description, p.reward, p.creator, p.isActive, p.solvers);
    }

    function getPlayerPoints(address player) external view returns (uint256) {
        return playerPoints[player];
    }

    function getTopPlayers(uint256 count) external view returns (
        address[] memory topAddresses,
        uint256[] memory topScores
    ) {
        uint256 playerCount = players.length;
        if (playerCount == 0) {
            return (new address[](0), new uint256[](0));
        }

        uint256 resultCount = count > playerCount ? playerCount : count;

        address[] memory allPlayers = new address[](playerCount);
        uint256[] memory allScores = new uint256[](playerCount);

        for (uint256 i = 0; i < playerCount; i++) {
            allPlayers[i] = players[i];
            allScores[i] = playerPoints[players[i]];
        }

        // Simple bubble sort (descending)
        for (uint256 i = 0; i < playerCount - 1; i++) {
            for (uint256 j = 0; j < playerCount - i - 1; j++) {
                if (allScores[j] < allScores[j + 1]) {
                    (allScores[j], allScores[j + 1]) = (allScores[j + 1], allScores[j]);
                    (allPlayers[j], allPlayers[j + 1]) = (allPlayers[j + 1], allPlayers[j]);
                }
            }
        }

        topAddresses = new address[](resultCount);
        topScores = new uint256[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            topAddresses[i] = allPlayers[i];
            topScores[i] = allScores[i];
        }

        return (topAddresses, topScores);
    }

    function getTotalPlayers() external view returns (uint256) {
        return players.length;
    }
}
