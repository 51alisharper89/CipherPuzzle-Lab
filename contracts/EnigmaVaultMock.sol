// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EnigmaVaultMock
 * @notice 模拟FHE功能的谜题合约 - 可在标准Sepolia上运行
 * @dev 这是一个测试版本，使用普通加密而非FHE，用于前端集成测试
 */
contract EnigmaVaultMock {
    struct Puzzle {
        string title;
        string description;
        uint256 reward;
        address creator;
        bool isActive;
        uint256 solvers;
        bytes32 correctAnswerHash;  // 使用hash代替FHE加密
    }

    address public owner;
    uint256 public totalPuzzles;

    mapping(uint256 => Puzzle) public puzzles;
    mapping(address => uint256) public playerPoints;
    mapping(uint256 => mapping(address => bool)) public hasSolved;

    address[] public players;
    mapping(address => bool) public hasPlayed;

    event PuzzleCreated(uint256 indexed puzzleId, string title, uint256 reward);
    event SolutionSubmitted(uint256 indexed puzzleId, address indexed player, bool correct);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice 创建谜题（测试版本 - 明文答案）
     * @param puzzleId 谜题ID
     * @param title 标题
     * @param description 描述
     * @param plainAnswer 明文答案
     */
    function createPuzzleTest(
        uint256 puzzleId,
        string memory title,
        string memory description,
        uint32 plainAnswer
    ) external payable {
        require(msg.sender == owner, "Only owner");
        require(puzzles[puzzleId].creator == address(0), "Puzzle ID exists");
        require(msg.value > 0, "Reward required");

        // 使用 hash 存储答案
        bytes32 answerHash = keccak256(abi.encodePacked(plainAnswer));

        puzzles[puzzleId] = Puzzle({
            title: title,
            description: description,
            reward: msg.value,
            creator: msg.sender,
            isActive: true,
            solvers: 0,
            correctAnswerHash: answerHash
        });

        totalPuzzles++;
        emit PuzzleCreated(puzzleId, title, msg.value);
    }

    /**
     * @notice 提交答案（模拟FHE接口）
     * @param puzzleId 谜题ID
     * @param encryptedAnswer 用户答案（这里实际是明文的bytes32格式）
     * @param inputProof 输入证明（这里不验证，仅保留接口兼容性）
     */
    function submitSolution(
        uint256 puzzleId,
        bytes32 encryptedAnswer,  // 前端需要发送 uint32 转 bytes32
        bytes calldata inputProof  // 保留参数但不使用
    ) external {
        Puzzle storage puzzle = puzzles[puzzleId];
        require(puzzle.isActive, "Puzzle not active");
        require(!hasSolved[puzzleId][msg.sender], "Already solved");

        // 从 bytes32 中提取 uint32（前端会发送 uint32 值填充到 bytes32）
        uint32 userAnswer = uint32(uint256(encryptedAnswer));
        bytes32 userAnswerHash = keccak256(abi.encodePacked(userAnswer));

        // 比较 hash
        bool isCorrect = (userAnswerHash == puzzle.correctAnswerHash);

        // Add player to leaderboard if first time
        if (!hasPlayed[msg.sender]) {
            players.push(msg.sender);
            hasPlayed[msg.sender] = true;
        }

        // 标记已提交
        hasSolved[puzzleId][msg.sender] = true;

        if (isCorrect) {
            playerPoints[msg.sender] += 100;
            puzzle.solvers++;
        }

        emit SolutionSubmitted(puzzleId, msg.sender, isCorrect);
    }

    /**
     * @notice 获取谜题信息
     */
    function getPuzzle(uint256 puzzleId) external view returns (
        string memory title,
        string memory description,
        uint256 reward,
        address creator,
        bool isActive,
        uint256 solvers
    ) {
        Puzzle memory puzzle = puzzles[puzzleId];
        return (
            puzzle.title,
            puzzle.description,
            puzzle.reward,
            puzzle.creator,
            puzzle.isActive,
            puzzle.solvers
        );
    }

    /**
     * @notice 获取排行榜前N名玩家
     */
    function getTopPlayers(uint256 count) external view returns (
        address[] memory topAddresses,
        uint256[] memory topScores
    ) {
        uint256 playerCount = players.length;
        if (playerCount == 0) {
            return (new address[](0), new uint256[](0));
        }

        uint256 returnCount = count > playerCount ? playerCount : count;

        address[] memory tempAddresses = new address[](playerCount);
        uint256[] memory tempScores = new uint256[](playerCount);

        for (uint256 i = 0; i < playerCount; i++) {
            tempAddresses[i] = players[i];
            tempScores[i] = playerPoints[players[i]];
        }

        for (uint256 i = 0; i < playerCount - 1; i++) {
            for (uint256 j = 0; j < playerCount - i - 1; j++) {
                if (tempScores[j] < tempScores[j + 1]) {
                    (tempScores[j], tempScores[j + 1]) = (tempScores[j + 1], tempScores[j]);
                    (tempAddresses[j], tempAddresses[j + 1]) = (tempAddresses[j + 1], tempAddresses[j]);
                }
            }
        }

        topAddresses = new address[](returnCount);
        topScores = new uint256[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            topAddresses[i] = tempAddresses[i];
            topScores[i] = tempScores[i];
        }

        return (topAddresses, topScores);
    }

    /**
     * @notice 提取合约余额（仅owner）
     */
    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
}
