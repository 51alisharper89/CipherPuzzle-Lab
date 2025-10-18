// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PuzzleHints.sol";

/**
 * @title PuzzleManagement
 * @notice Puzzle lifecycle management (pause, resume, end)
 */
contract PuzzleManagement is PuzzleHints {
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
}
