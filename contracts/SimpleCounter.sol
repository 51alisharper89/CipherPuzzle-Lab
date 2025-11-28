// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title SimpleCounter
 * @notice A simple encrypted counter for testing FHE deployment
 */
contract SimpleCounter is ZamaEthereumConfig {
    euint32 private counter;
    address public owner;

    event CounterIncremented(address indexed user);

    constructor() {
        owner = msg.sender;
        counter = FHE.asEuint32(0);
        FHE.allowThis(counter);
    }

    function increment() public {
        counter = FHE.add(counter, FHE.asEuint32(1));
        FHE.allowThis(counter);
        FHE.allow(counter, msg.sender);
        emit CounterIncremented(msg.sender);
    }

    function getEncryptedCounter() public view returns (euint32) {
        return counter;
    }
}
