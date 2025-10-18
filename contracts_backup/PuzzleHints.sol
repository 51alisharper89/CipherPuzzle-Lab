// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import "./PuzzleCore.sol";

/**
 * @title PuzzleHints
 * @notice Hint purchase and management system
 */
contract PuzzleHints is PuzzleCore {
    function purchaseHint(
        uint256 puzzleId,
        HintType hintType,
        externalEuint32 hintValue,
        bytes calldata inputProof
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

        if (msg.value > hintCost) {
            payable(msg.sender).transfer(msg.value - hintCost);
        }

        emit HintPurchased(puzzleId, msg.sender, hintType, hintCost);
    }

    function _calculateHintCost(uint256 puzzleId, address player) internal view returns (uint256) {
        uint256 hintsUsed = playerHints[puzzleId][player].length;
        return hintBaseCost * (2 ** hintsUsed);
    }

    function getHintCount(uint256 puzzleId, address player) external view returns (uint256) {
        return playerHints[puzzleId][player].length;
    }
}
