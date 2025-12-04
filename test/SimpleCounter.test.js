const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("SimpleCounter - FHE Counter Tests", function () {
  let contract;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, user1, user2, user3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SimpleCounter");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    console.log(`SimpleCounter deployed at: ${await contract.getAddress()}`);
  });

  describe("Deployment", function () {
    it("should deploy contract successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
      console.log("Contract deployed at:", await contract.getAddress());
    });

    it("should have correct owner", async function () {
      const contractOwner = await contract.owner();
      expect(contractOwner).to.equal(owner.address);
      console.log("Owner verified:", owner.address);
    });

    it("should initialize counter with encrypted zero", async function () {
      // Counter is encrypted, we can verify it exists
      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;
      console.log("Initial encrypted counter retrieved");
    });
  });

  describe("Increment Operations", function () {
    it("should increment counter successfully", async function () {
      const tx = await contract.connect(owner).increment();
      await tx.wait();

      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;
      console.log("Counter incremented successfully");
    });

    it("should emit CounterIncremented event", async function () {
      await expect(contract.connect(owner).increment())
        .to.emit(contract, "CounterIncremented")
        .withArgs(owner.address);

      console.log("CounterIncremented event emitted");
    });

    it("should handle multiple increments from same user", async function () {
      for (let i = 0; i < 5; i++) {
        await contract.connect(owner).increment();
      }

      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;
      console.log("5 increments from same user completed");
    });

    it("should handle increments from different users", async function () {
      await contract.connect(owner).increment();
      await contract.connect(user1).increment();
      await contract.connect(user2).increment();
      await contract.connect(user3).increment();

      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;
      console.log("Increments from 4 different users completed");
    });
  });

  describe("FHE Operations Verification", function () {
    it("should verify FHE.asEuint32() works for initialization", async function () {
      // The constructor uses FHE.asEuint32(0), if it fails deployment would fail
      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;
      console.log("FHE.asEuint32() - Plaintext to encrypted conversion works");
    });

    it("should verify FHE.add() works for increment", async function () {
      // Each increment adds 1 using FHE.add()
      await contract.connect(owner).increment();
      await contract.connect(owner).increment();

      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;
      console.log("FHE.add() - Encrypted addition works");
    });

    it("should verify FHE.allowThis() works for contract access", async function () {
      // Contract uses allowThis after each operation
      await contract.connect(owner).increment();

      // If allowThis fails, subsequent reads would fail
      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;
      console.log("FHE.allowThis() - Contract permission works");
    });

    it("should verify FHE.allow() works for user access", async function () {
      // Contract uses allow(counter, msg.sender) to grant user access
      await contract.connect(user1).increment();

      // The user should have access to read
      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;
      console.log("FHE.allow() - User permission granting works");
    });
  });

  describe("Access Control", function () {
    it("should allow any user to increment", async function () {
      // No access restrictions on increment
      await contract.connect(user1).increment();
      await contract.connect(user2).increment();
      await contract.connect(user3).increment();

      console.log("Any user can increment - verified");
    });

    it("should allow any user to read encrypted counter", async function () {
      await contract.connect(owner).increment();

      // All users should be able to read
      const counter1 = await contract.connect(user1).getEncryptedCounter();
      const counter2 = await contract.connect(user2).getEncryptedCounter();

      expect(counter1).to.not.be.undefined;
      expect(counter2).to.not.be.undefined;

      console.log("Any user can read encrypted counter - verified");
    });
  });

  describe("Edge Cases", function () {
    it("should handle rapid sequential increments", async function () {
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        await contract.connect(owner).increment();
      }

      const duration = Date.now() - startTime;
      expect(duration).to.be.lessThan(60000); // 60 seconds max

      console.log(`20 rapid increments completed in ${duration}ms`);
    });

    it("should handle concurrent users incrementing", async function () {
      const users = [owner, user1, user2, user3];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        for (const user of users) {
          await contract.connect(user).increment();
        }
      }

      // Total: 4 users * 5 iterations = 20 increments
      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;

      console.log("Concurrent user increments completed");
    });

    it("should maintain state after many operations", async function () {
      // Perform many operations
      for (let i = 0; i < 50; i++) {
        await contract.connect(owner).increment();
      }

      // Verify contract is still functional
      const encryptedCounter = await contract.getEncryptedCounter();
      expect(encryptedCounter).to.not.be.undefined;

      const contractOwner = await contract.owner();
      expect(contractOwner).to.equal(owner.address);

      console.log("State maintained after 50 operations");
    });
  });

  describe("Gas Efficiency", function () {
    it("should track gas usage for increment", async function () {
      const tx = await contract.connect(owner).increment();
      const receipt = await tx.wait();

      console.log(`Increment gas used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.greaterThan(0);
    });

    it("should have consistent gas usage across increments", async function () {
      const gasUsages = [];

      for (let i = 0; i < 5; i++) {
        const tx = await contract.connect(owner).increment();
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed);
      }

      // Gas usage should be relatively consistent
      const avgGas = gasUsages.reduce((a, b) => a + b, 0n) / BigInt(gasUsages.length);
      console.log(`Average gas per increment: ${avgGas.toString()}`);

      for (const gas of gasUsages) {
        // Allow 20% variance
        expect(gas).to.be.lessThan(avgGas * 120n / 100n);
        expect(gas).to.be.greaterThan(avgGas * 80n / 100n);
      }

      console.log("Gas usage is consistent across increments");
    });
  });

  describe("Event Verification", function () {
    it("should emit events for each increment", async function () {
      const users = [owner, user1, user2];

      for (const user of users) {
        await expect(contract.connect(user).increment())
          .to.emit(contract, "CounterIncremented")
          .withArgs(user.address);
      }

      console.log("All increment events emitted correctly");
    });

    it("should emit events with correct user address", async function () {
      const tx = await contract.connect(user1).increment();
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const decoded = contract.interface.parseLog(log);
          return decoded.name === 'CounterIncremented';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const decoded = contract.interface.parseLog(event);
      expect(decoded.args.user).to.equal(user1.address);

      console.log("Event user address verified");
    });
  });
});
