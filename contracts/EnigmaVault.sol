// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EnigmaVault
 * @notice Simple puzzle vault contract (non-FHE version for initial deployment)
 */
contract EnigmaVault {
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
    }

    mapping(uint256 => Puzzle) public puzzles;
    mapping(address => uint256) public playerPoints;
    address[] public players;
    mapping(address => bool) private hasPlayed;

    event PuzzleCreated(uint256 indexed puzzleId, string title, uint256 reward);
    event PuzzleSolved(uint256 indexed puzzleId, address indexed solver);

    constructor() {
        owner = msg.sender;
    }

    function createPuzzle(
        uint256 puzzleId,
        string memory title,
        string memory description
    ) external payable {
        require(puzzles[puzzleId].creator == address(0), "Puzzle ID exists");
        require(msg.value > 0, "Reward required");

        puzzles[puzzleId] = Puzzle({
            title: title,
            description: description,
            reward: msg.value,
            creator: msg.sender,
            isActive: true,
            solvers: 0
        });

        totalPuzzles++;
        emit PuzzleCreated(puzzleId, title, msg.value);
    }

    function submitSolution(uint256 puzzleId, uint256 answer) external {
        Puzzle storage puzzle = puzzles[puzzleId];
        require(puzzle.isActive, "Puzzle not active");

        // Add player to leaderboard if first time
        if (!hasPlayed[msg.sender]) {
            players.push(msg.sender);
            hasPlayed[msg.sender] = true;
        }

        // Simple validation (in real version, this would be FHE encrypted)
        puzzle.solvers++;
        totalSolvers++;
        playerPoints[msg.sender] += 100;

        emit PuzzleSolved(puzzleId, msg.sender);
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

        // Create arrays for all players
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
                    // Swap scores
                    (allScores[j], allScores[j + 1]) = (allScores[j + 1], allScores[j]);
                    // Swap addresses
                    (allPlayers[j], allPlayers[j + 1]) = (allPlayers[j + 1], allPlayers[j]);
                }
            }
        }

        // Return top N
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
