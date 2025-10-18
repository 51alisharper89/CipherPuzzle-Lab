// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title SimpleCounter
 * @notice A simple encrypted counter for testing FHE deployment
 */
contract SimpleCounter {
    euint32 private counter;
    address public owner;

    event CounterIncremented(address indexed user);

    constructor() {
        owner = msg.sender;
        counter = TFHE.asEuint32(0);
        TFHE.allow(counter, address(this));
    }

    function increment() public {
        counter = TFHE.add(counter, 1);
        TFHE.allow(counter, address(this));
        TFHE.allow(counter, msg.sender);
        emit CounterIncremented(msg.sender);
    }

    function getEncryptedCounter() public view returns (euint32) {
        return counter;
    }
}
