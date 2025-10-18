// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PuzzleRewards.sol";

/**
 * @title CipherPuzzleLabV2
 * @notice Modular FHE-based puzzle gaming platform with encrypted solutions and gameplay
 * @dev Refactored into separate modules for better maintainability:
 *      - PuzzleStorage: Data structures and storage
 *      - PuzzleEvents: Events and errors
 *      - PuzzleCore: Core puzzle creation and attempts
 *      - PuzzleHints: Hint purchase system
 *      - PuzzleManagement: Lifecycle management
 *      - PuzzleDecryption: Gateway callbacks
 *      - PuzzleRewards: Reward distribution
 */
contract CipherPuzzleLabV2 is PuzzleRewards {
    // View functions
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

    function getLeaderboardSize(uint256 puzzleId) external view returns (uint256) {
        return leaderboardPlayers[puzzleId].length;
    }

    function getGlobalStatistics() external view returns (uint256, uint256, uint256) {
        return (totalPuzzles, totalAttempts, totalPrizeDistributed);
    }

    // Admin functions
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
