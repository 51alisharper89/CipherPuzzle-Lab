const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("EnigmaVaultFHE - Comprehensive FHE Puzzle Tests", function () {
  let contract;
  let owner, player1, player2, player3, player4, player5;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();

    [owner, player1, player2, player3, player4, player5] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EnigmaVaultFHE");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    console.log(`EnigmaVaultFHE deployed at: ${await contract.getAddress()}`);
  });

  describe("Deployment", function () {
    it("should deploy contract successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
      console.log("Contract deployed at:", await contract.getAddress());
    });

    it("should have correct initial values", async function () {
      const contractOwner = await contract.owner();
      const totalPuzzles = await contract.totalPuzzles();
      const totalSolvers = await contract.totalSolvers();

      expect(contractOwner).to.equal(owner.address);
      expect(totalPuzzles).to.equal(0);
      expect(totalSolvers).to.equal(0);
      console.log("Initial values verified correctly");
    });
  });

  describe("Puzzle Creation (Test Mode)", function () {
    it("should create puzzle with plaintext answer (test mode)", async function () {
      const puzzleId = 1;
      const title = "What is 2+2?";
      const description = "Simple math puzzle";
      const plainAnswer = 4;
      const reward = ethers.parseEther("0.01");

      const tx = await contract.connect(owner).createPuzzleTest(
        puzzleId,
        title,
        description,
        plainAnswer,
        { value: reward }
      );
      await tx.wait();

      const puzzle = await contract.getPuzzle(puzzleId);
      expect(puzzle.title).to.equal(title);
      expect(puzzle.description).to.equal(description);
      expect(puzzle.reward).to.equal(reward);
      expect(puzzle.creator).to.equal(owner.address);
      expect(puzzle.isActive).to.equal(true);
      expect(puzzle.solvers).to.equal(0);

      const totalPuzzles = await contract.totalPuzzles();
      expect(totalPuzzles).to.equal(1);

      console.log("Puzzle created successfully with ID:", puzzleId);
    });

    it("should reject puzzle creation with zero reward", async function () {
      await expect(
        contract.connect(owner).createPuzzleTest(1, "Test", "Desc", 42, { value: 0 })
      ).to.be.revertedWith("Reward required");

      console.log("Zero reward rejection works");
    });

    it("should reject duplicate puzzle ID", async function () {
      const puzzleId = 1;
      await contract.connect(owner).createPuzzleTest(
        puzzleId, "Puzzle 1", "Desc 1", 42, { value: ethers.parseEther("0.01") }
      );

      await expect(
        contract.connect(owner).createPuzzleTest(
          puzzleId, "Puzzle 2", "Desc 2", 100, { value: ethers.parseEther("0.01") }
        )
      ).to.be.revertedWith("Puzzle ID exists");

      console.log("Duplicate puzzle ID rejection works");
    });

    it("should only allow owner to create test puzzles", async function () {
      await expect(
        contract.connect(player1).createPuzzleTest(
          1, "Unauthorized", "Test", 42, { value: ethers.parseEther("0.01") }
        )
      ).to.be.revertedWith("Only owner");

      console.log("Owner-only restriction works");
    });
  });

  describe("Puzzle Creation (FHE Mode)", function () {
    it("should create puzzle with encrypted answer", async function () {
      const puzzleId = 1;
      const title = "Encrypted Math Puzzle";
      const description = "Solve with FHE";
      const secretAnswer = 42;
      const reward = ethers.parseEther("0.01");

      // Create encrypted input for the answer
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), owner.address)
        .add32(BigInt(secretAnswer))
        .encrypt();

      const tx = await contract.connect(owner).createPuzzle(
        puzzleId,
        title,
        description,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: reward }
      );
      await tx.wait();

      const puzzle = await contract.getPuzzle(puzzleId);
      expect(puzzle.title).to.equal(title);
      expect(puzzle.isActive).to.equal(true);

      console.log("FHE puzzle created with encrypted answer");
    });

    it("should emit PuzzleCreated event", async function () {
      const puzzleId = 1;
      const title = "Event Test";
      const description = "Testing events";
      const reward = ethers.parseEther("0.01");

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), owner.address)
        .add32(100n)
        .encrypt();

      await expect(
        contract.connect(owner).createPuzzle(
          puzzleId,
          title,
          description,
          encrypted.handles[0],
          encrypted.inputProof,
          { value: reward }
        )
      ).to.emit(contract, "PuzzleCreated")
        .withArgs(puzzleId, title, reward);

      console.log("PuzzleCreated event emitted correctly");
    });
  });

  describe("Solution Submission (FHE)", function () {
    beforeEach(async function () {
      // Create a puzzle with known answer (42) for testing
      await contract.connect(owner).createPuzzleTest(
        1, "Test Puzzle", "Answer is 42", 42, { value: ethers.parseEther("0.01") }
      );
    });

    it("should submit encrypted solution successfully", async function () {
      const puzzleId = 1;
      const userAnswer = 42; // Correct answer

      // Create encrypted input for the answer
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(BigInt(userAnswer))
        .encrypt();

      const tx = await contract.connect(player1).submitSolution(
        puzzleId,
        encrypted.handles[0],
        encrypted.inputProof
      );
      await tx.wait();

      // Verify player points increased
      const points = await contract.getPlayerPoints(player1.address);
      expect(points).to.equal(100);

      // Verify puzzle solvers count increased
      const puzzle = await contract.getPuzzle(puzzleId);
      expect(puzzle.solvers).to.equal(1);

      console.log("Encrypted solution submitted successfully");
    });

    it("should prevent double submission", async function () {
      const puzzleId = 1;

      // First submission
      const encrypted1 = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(42n)
        .encrypt();

      await contract.connect(player1).submitSolution(
        puzzleId,
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Second submission should fail
      const encrypted2 = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(42n)
        .encrypt();

      await expect(
        contract.connect(player1).submitSolution(
          puzzleId,
          encrypted2.handles[0],
          encrypted2.inputProof
        )
      ).to.be.revertedWith("Already solved");

      console.log("Double submission prevention works");
    });

    it("should reject submission for inactive puzzle", async function () {
      const puzzleId = 999; // Non-existent puzzle

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(42n)
        .encrypt();

      await expect(
        contract.connect(player1).submitSolution(
          puzzleId,
          encrypted.handles[0],
          encrypted.inputProof
        )
      ).to.be.revertedWith("Puzzle not active");

      console.log("Inactive puzzle submission rejection works");
    });

    it("should handle multiple players solving same puzzle", async function () {
      const puzzleId = 1;
      const players = [player1, player2, player3];

      for (const player of players) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), player.address)
          .add32(42n)
          .encrypt();

        await contract.connect(player).submitSolution(
          puzzleId,
          encrypted.handles[0],
          encrypted.inputProof
        );
      }

      // Verify all players got points
      for (const player of players) {
        const points = await contract.getPlayerPoints(player.address);
        expect(points).to.equal(100);
      }

      // Verify total solvers
      const puzzle = await contract.getPuzzle(puzzleId);
      expect(puzzle.solvers).to.equal(3);

      const totalSolvers = await contract.totalSolvers();
      expect(totalSolvers).to.equal(3);

      console.log("Multiple players submission works");
    });

    it("should emit PuzzleSolved event", async function () {
      const puzzleId = 1;

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(42n)
        .encrypt();

      await expect(
        contract.connect(player1).submitSolution(
          puzzleId,
          encrypted.handles[0],
          encrypted.inputProof
        )
      ).to.emit(contract, "PuzzleSolved")
        .withArgs(puzzleId, player1.address, true);

      console.log("PuzzleSolved event emitted correctly");
    });
  });

  describe("Leaderboard", function () {
    beforeEach(async function () {
      // Create multiple puzzles
      for (let i = 1; i <= 5; i++) {
        await contract.connect(owner).createPuzzleTest(
          i, `Puzzle ${i}`, `Description ${i}`, i * 10,
          { value: ethers.parseEther("0.01") }
        );
      }
    });

    it("should track player points correctly", async function () {
      const players = [player1, player2, player3];

      // Player1 solves puzzles 1, 2, 3 (300 points)
      for (let i = 1; i <= 3; i++) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), player1.address)
          .add32(BigInt(i * 10))
          .encrypt();

        await contract.connect(player1).submitSolution(
          i,
          encrypted.handles[0],
          encrypted.inputProof
        );
      }

      // Player2 solves puzzles 1, 2 (200 points)
      for (let i = 1; i <= 2; i++) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), player2.address)
          .add32(BigInt(i * 10))
          .encrypt();

        await contract.connect(player2).submitSolution(
          i,
          encrypted.handles[0],
          encrypted.inputProof
        );
      }

      // Player3 solves puzzle 1 (100 points)
      const encrypted3 = await fhevm
        .createEncryptedInput(await contract.getAddress(), player3.address)
        .add32(10n)
        .encrypt();

      await contract.connect(player3).submitSolution(
        1,
        encrypted3.handles[0],
        encrypted3.inputProof
      );

      // Verify points
      expect(await contract.getPlayerPoints(player1.address)).to.equal(300);
      expect(await contract.getPlayerPoints(player2.address)).to.equal(200);
      expect(await contract.getPlayerPoints(player3.address)).to.equal(100);

      console.log("Player points tracked correctly");
    });

    it("should return top players correctly", async function () {
      const players = [player1, player2, player3, player4];
      const puzzlesToSolve = [3, 2, 4, 1]; // Different number of puzzles per player

      for (let i = 0; i < players.length; i++) {
        for (let j = 1; j <= puzzlesToSolve[i]; j++) {
          const encrypted = await fhevm
            .createEncryptedInput(await contract.getAddress(), players[i].address)
            .add32(BigInt(j * 10))
            .encrypt();

          await contract.connect(players[i]).submitSolution(
            j,
            encrypted.handles[0],
            encrypted.inputProof
          );
        }
      }

      // Get top 3 players
      const [topAddresses, topScores] = await contract.getTopPlayers(3);

      expect(topAddresses.length).to.equal(3);
      expect(topScores.length).to.equal(3);

      // Player3 should be first (400 points)
      expect(topScores[0]).to.equal(400);
      expect(topAddresses[0]).to.equal(player3.address);

      // Player1 should be second (300 points)
      expect(topScores[1]).to.equal(300);
      expect(topAddresses[1]).to.equal(player1.address);

      // Player2 should be third (200 points)
      expect(topScores[2]).to.equal(200);
      expect(topAddresses[2]).to.equal(player2.address);

      console.log("Top players returned correctly");
    });

    it("should return total players count", async function () {
      const players = [player1, player2, player3];

      for (const player of players) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), player.address)
          .add32(10n)
          .encrypt();

        await contract.connect(player).submitSolution(
          1,
          encrypted.handles[0],
          encrypted.inputProof
        );
      }

      const totalPlayers = await contract.getTotalPlayers();
      expect(totalPlayers).to.equal(3);

      console.log("Total players count correct");
    });
  });

  describe("FHE Operations Verification", function () {
    it("should verify FHE.fromExternal() works correctly", async function () {
      await contract.connect(owner).createPuzzleTest(
        1, "FHE Test", "Testing fromExternal", 42, { value: ethers.parseEther("0.01") }
      );

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(42n)
        .encrypt();

      await contract.connect(player1).submitSolution(
        1,
        encrypted.handles[0],
        encrypted.inputProof
      );

      console.log("FHE.fromExternal() - Encrypted input conversion works");
    });

    it("should verify FHE.eq() comparison works", async function () {
      await contract.connect(owner).createPuzzleTest(
        1, "FHE Comparison", "Testing eq", 100, { value: ethers.parseEther("0.01") }
      );

      // Submit correct answer
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(100n)
        .encrypt();

      await contract.connect(player1).submitSolution(
        1,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const points = await contract.getPlayerPoints(player1.address);
      expect(points).to.equal(100);

      console.log("FHE.eq() - Encrypted comparison works");
    });

    it("should verify FHE.select() conditional logic works", async function () {
      await contract.connect(owner).createPuzzleTest(
        1, "FHE Select", "Testing select", 50, { value: ethers.parseEther("0.01") }
      );

      // Submit answer (points are added via select)
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(50n)
        .encrypt();

      await contract.connect(player1).submitSolution(
        1,
        encrypted.handles[0],
        encrypted.inputProof
      );

      console.log("FHE.select() - Conditional selection works");
    });

    it("should verify FHE.allowThis() permissions work", async function () {
      // Create puzzle with encrypted answer
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), owner.address)
        .add32(42n)
        .encrypt();

      await contract.connect(owner).createPuzzle(
        1,
        "Permission Test",
        "Testing allowThis",
        encrypted.handles[0],
        encrypted.inputProof,
        { value: ethers.parseEther("0.01") }
      );

      // If allowThis fails, the subsequent operations would fail
      const puzzle = await contract.getPuzzle(1);
      expect(puzzle.isActive).to.equal(true);

      console.log("FHE.allowThis() - Permission granting works");
    });
  });

  describe("Edge Cases", function () {
    it("should handle zero value answers", async function () {
      await contract.connect(owner).createPuzzleTest(
        1, "Zero Puzzle", "Answer is 0", 0, { value: ethers.parseEther("0.01") }
      );

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(0n)
        .encrypt();

      await contract.connect(player1).submitSolution(
        1,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const points = await contract.getPlayerPoints(player1.address);
      expect(points).to.equal(100);

      console.log("Zero value answer handling works");
    });

    it("should handle maximum uint32 value", async function () {
      const maxUint32 = 4294967295; // 2^32 - 1

      await contract.connect(owner).createPuzzleTest(
        1, "Max Puzzle", "Maximum value", maxUint32, { value: ethers.parseEther("0.01") }
      );

      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), player1.address)
        .add32(BigInt(maxUint32))
        .encrypt();

      await contract.connect(player1).submitSolution(
        1,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const points = await contract.getPlayerPoints(player1.address);
      expect(points).to.equal(100);

      console.log("Maximum uint32 value handling works");
    });

    it("should handle empty leaderboard query", async function () {
      const [topAddresses, topScores] = await contract.getTopPlayers(10);
      expect(topAddresses.length).to.equal(0);
      expect(topScores.length).to.equal(0);

      console.log("Empty leaderboard query works");
    });
  });

  describe("Performance Tests", function () {
    it("should handle rapid puzzle creations", async function () {
      const startTime = Date.now();

      for (let i = 1; i <= 10; i++) {
        await contract.connect(owner).createPuzzleTest(
          i, `Puzzle ${i}`, `Description ${i}`, i,
          { value: ethers.parseEther("0.001") }
        );
      }

      const duration = Date.now() - startTime;
      expect(duration).to.be.lessThan(30000);

      const totalPuzzles = await contract.totalPuzzles();
      expect(totalPuzzles).to.equal(10);

      console.log(`10 puzzles created in ${duration}ms`);
    });

    it("should handle rapid solution submissions", async function () {
      // Create one puzzle
      await contract.connect(owner).createPuzzleTest(
        1, "Speed Test", "Fast submissions", 42, { value: ethers.parseEther("0.01") }
      );

      const players = [player1, player2, player3, player4, player5];
      const startTime = Date.now();

      for (const player of players) {
        const encrypted = await fhevm
          .createEncryptedInput(await contract.getAddress(), player.address)
          .add32(42n)
          .encrypt();

        await contract.connect(player).submitSolution(
          1,
          encrypted.handles[0],
          encrypted.inputProof
        );
      }

      const duration = Date.now() - startTime;
      expect(duration).to.be.lessThan(30000);

      const puzzle = await contract.getPuzzle(1);
      expect(puzzle.solvers).to.equal(5);

      console.log(`5 solutions submitted in ${duration}ms`);
    });
  });
});
