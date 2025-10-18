// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE} from "@fhevm/solidity/lib/FHE.sol";
import "./PuzzleDecryption.sol";

/**
 * @title PuzzleRewards
 * @notice Reward distribution system
 */
contract PuzzleRewards is PuzzleDecryption {
    function distributeRewards(uint256 puzzleId) external onlyRewardManager {
        PuzzleMetadata storage puzzle = puzzles[puzzleId];
        if (puzzle.creator == address(0)) revert PuzzleNotFound();
        if (puzzle.status != PuzzleStatus.Revealed) revert InvalidStatus();
        if (distributions[puzzleId].completed) revert AlreadyDistributed();

        address[] memory players = leaderboardPlayers[puzzleId];
        if (players.length == 0) revert NoWinners();

        address[] memory topPlayers = new address[](3);
        uint32[] memory topScores = new uint32[](3);

        for (uint256 i = 0; i < players.length; i++) {
            LeaderboardEntry storage entry = leaderboard[puzzleId][players[i]];
            if (!entry.decrypted) continue;

            for (uint256 j = 0; j < 3; j++) {
                if (entry.decryptedTotalScore > topScores[j]) {
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
}
