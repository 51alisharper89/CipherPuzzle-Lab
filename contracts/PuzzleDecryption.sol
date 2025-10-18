// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Gateway} from "@fhevm/solidity/gateway/Gateway.sol";
import "./PuzzleManagement.sol";

/**
 * @title PuzzleDecryption
 * @notice Gateway decryption callbacks for solutions and leaderboards
 */
contract PuzzleDecryption is PuzzleManagement {
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
}
