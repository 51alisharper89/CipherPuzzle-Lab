const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnigmaVault - Non-FHE Basic Tests", function () {
  let contract;
  let owner, player1, player2, player3;

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EnigmaVault");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    console.log(`EnigmaVault deployed at: ${await contract.getAddress()}`);
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
      console.log("Initial values verified");
    });
  });

  describe("Puzzle Creation", function () {
    it("should create puzzle successfully", async function () {
      const puzzleId = 1;
      const title = "Basic Math";
      const description = "What is 2+2?";
      const reward = ethers.parseEther("0.01");

      const tx = await contract.connect(owner).createPuzzle(
        puzzleId,
        title,
        description,
        { value: reward }
      );
      await tx.wait();

      const puzzle = await contract.getPuzzle(puzzleId);
      expect(puzzle.title).to.equal(title);
      expect(puzzle.description).to.equal(description);
      expect(puzzle.reward).to.equal(reward);
      expect(puzzle.creator).to.equal(owner.address);
      expect(puzzle.isActive).to.equal(true);

      console.log("Puzzle created successfully");
    });

    it("should emit PuzzleCreated event", async function () {
      const puzzleId = 1;
      const title = "Test Puzzle";
      const reward = ethers.parseEther("0.01");

      await expect(
        contract.connect(owner).createPuzzle(puzzleId, title, "Description", { value: reward })
      ).to.emit(contract, "PuzzleCreated")
        .withArgs(puzzleId, title, reward);

      console.log("PuzzleCreated event emitted");
    });

    it("should reject puzzle with zero reward", async function () {
      await expect(
        contract.connect(owner).createPuzzle(1, "Test", "Desc", { value: 0 })
      ).to.be.revertedWith("Reward required");

      console.log("Zero reward rejection works");
    });

    it("should reject duplicate puzzle ID", async function () {
      const puzzleId = 1;
      await contract.connect(owner).createPuzzle(puzzleId, "First", "Desc", { value: ethers.parseEther("0.01") });

      await expect(
        contract.connect(owner).createPuzzle(puzzleId, "Second", "Desc", { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Puzzle ID exists");

      console.log("Duplicate ID rejection works");
    });

    it("should allow anyone to create puzzles", async function () {
      await contract.connect(player1).createPuzzle(1, "Player1 Puzzle", "Desc", { value: ethers.parseEther("0.01") });
      await contract.connect(player2).createPuzzle(2, "Player2 Puzzle", "Desc", { value: ethers.parseEther("0.01") });

      const puzzle1 = await contract.getPuzzle(1);
      const puzzle2 = await contract.getPuzzle(2);

      expect(puzzle1.creator).to.equal(player1.address);
      expect(puzzle2.creator).to.equal(player2.address);

      console.log("Multiple creators verified");
    });
  });

  describe("Solution Submission", function () {
    beforeEach(async function () {
      await contract.connect(owner).createPuzzle(1, "Test", "Desc", { value: ethers.parseEther("0.01") });
    });

    it("should accept solution submission", async function () {
      await contract.connect(player1).submitSolution(1, 42);

      const points = await contract.getPlayerPoints(player1.address);
      expect(points).to.equal(100);

      console.log("Solution accepted");
    });

    it("should emit PuzzleSolved event", async function () {
      await expect(contract.connect(player1).submitSolution(1, 42))
        .to.emit(contract, "PuzzleSolved")
        .withArgs(1, player1.address);

      console.log("PuzzleSolved event emitted");
    });

    it("should increment solver count", async function () {
      await contract.connect(player1).submitSolution(1, 42);
      await contract.connect(player2).submitSolution(1, 42);

      const puzzle = await contract.getPuzzle(1);
      expect(puzzle.solvers).to.equal(2);

      const totalSolvers = await contract.totalSolvers();
      expect(totalSolvers).to.equal(2);

      console.log("Solver counts updated");
    });

    it("should reject submission for non-existent puzzle", async function () {
      await expect(
        contract.connect(player1).submitSolution(999, 42)
      ).to.be.revertedWith("Puzzle not active");

      console.log("Non-existent puzzle rejection works");
    });
  });

  describe("Leaderboard", function () {
    beforeEach(async function () {
      // Create multiple puzzles
      for (let i = 1; i <= 5; i++) {
        await contract.connect(owner).createPuzzle(i, `Puzzle ${i}`, `Desc ${i}`, { value: ethers.parseEther("0.01") });
      }
    });

    it("should track player points correctly", async function () {
      // Player1 solves 3 puzzles = 300 points
      for (let i = 1; i <= 3; i++) {
        await contract.connect(player1).submitSolution(i, 42);
      }

      // Player2 solves 2 puzzles = 200 points
      for (let i = 1; i <= 2; i++) {
        await contract.connect(player2).submitSolution(i, 42);
      }

      // Player3 solves 1 puzzle = 100 points
      await contract.connect(player3).submitSolution(1, 42);

      expect(await contract.getPlayerPoints(player1.address)).to.equal(300);
      expect(await contract.getPlayerPoints(player2.address)).to.equal(200);
      expect(await contract.getPlayerPoints(player3.address)).to.equal(100);

      console.log("Points tracked correctly");
    });

    it("should return top players sorted by score", async function () {
      // Create varying scores
      await contract.connect(player1).submitSolution(1, 42);
      await contract.connect(player1).submitSolution(2, 42);
      await contract.connect(player1).submitSolution(3, 42); // 300 points

      await contract.connect(player2).submitSolution(1, 42);
      await contract.connect(player2).submitSolution(2, 42); // 200 points

      await contract.connect(player3).submitSolution(1, 42); // 100 points

      const [topAddresses, topScores] = await contract.getTopPlayers(3);

      expect(topAddresses[0]).to.equal(player1.address);
      expect(topScores[0]).to.equal(300);

      expect(topAddresses[1]).to.equal(player2.address);
      expect(topScores[1]).to.equal(200);

      expect(topAddresses[2]).to.equal(player3.address);
      expect(topScores[2]).to.equal(100);

      console.log("Top players sorted correctly");
    });

    it("should return total players count", async function () {
      await contract.connect(player1).submitSolution(1, 42);
      await contract.connect(player2).submitSolution(1, 42);
      await contract.connect(player3).submitSolution(1, 42);

      const totalPlayers = await contract.getTotalPlayers();
      expect(totalPlayers).to.equal(3);

      console.log("Total players count correct");
    });

    it("should handle empty leaderboard", async function () {
      const [topAddresses, topScores] = await contract.getTopPlayers(10);
      expect(topAddresses.length).to.equal(0);
      expect(topScores.length).to.equal(0);

      console.log("Empty leaderboard handled");
    });

    it("should limit results to requested count", async function () {
      await contract.connect(player1).submitSolution(1, 42);
      await contract.connect(player2).submitSolution(1, 42);
      await contract.connect(player3).submitSolution(1, 42);

      const [topAddresses, topScores] = await contract.getTopPlayers(2);
      expect(topAddresses.length).to.equal(2);
      expect(topScores.length).to.equal(2);

      console.log("Result limiting works");
    });
  });

  describe("View Functions", function () {
    it("should get puzzle details", async function () {
      const puzzleId = 1;
      const title = "Test Puzzle";
      const description = "Test Description";
      const reward = ethers.parseEther("0.05");

      await contract.connect(owner).createPuzzle(puzzleId, title, description, { value: reward });

      const puzzle = await contract.getPuzzle(puzzleId);
      expect(puzzle.title).to.equal(title);
      expect(puzzle.description).to.equal(description);
      expect(puzzle.reward).to.equal(reward);
      expect(puzzle.creator).to.equal(owner.address);
      expect(puzzle.isActive).to.equal(true);
      expect(puzzle.solvers).to.equal(0);

      console.log("Puzzle details retrieved correctly");
    });

    it("should get player points", async function () {
      await contract.connect(owner).createPuzzle(1, "Test", "Desc", { value: ethers.parseEther("0.01") });

      // Before solving
      expect(await contract.getPlayerPoints(player1.address)).to.equal(0);

      // After solving
      await contract.connect(player1).submitSolution(1, 42);
      expect(await contract.getPlayerPoints(player1.address)).to.equal(100);

      console.log("Player points retrieved correctly");
    });
  });

  describe("Edge Cases", function () {
    it("should handle large puzzle IDs", async function () {
      const largeId = 999999999;
      await contract.connect(owner).createPuzzle(largeId, "Large ID", "Desc", { value: ethers.parseEther("0.01") });

      const puzzle = await contract.getPuzzle(largeId);
      expect(puzzle.isActive).to.equal(true);

      console.log("Large puzzle ID handled");
    });

    it("should handle long strings", async function () {
      const longTitle = "A".repeat(100);
      const longDesc = "B".repeat(500);

      await contract.connect(owner).createPuzzle(1, longTitle, longDesc, { value: ethers.parseEther("0.01") });

      const puzzle = await contract.getPuzzle(1);
      expect(puzzle.title).to.equal(longTitle);
      expect(puzzle.description).to.equal(longDesc);

      console.log("Long strings handled");
    });

    it("should handle minimum reward", async function () {
      await contract.connect(owner).createPuzzle(1, "Min", "Desc", { value: 1 }); // 1 wei

      const puzzle = await contract.getPuzzle(1);
      expect(puzzle.reward).to.equal(1);

      console.log("Minimum reward handled");
    });
  });

  describe("Gas Efficiency", function () {
    it("should track gas for puzzle creation", async function () {
      const tx = await contract.connect(owner).createPuzzle(1, "Gas Test", "Desc", { value: ethers.parseEther("0.01") });
      const receipt = await tx.wait();

      console.log(`Puzzle creation gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.greaterThan(0);
    });

    it("should track gas for solution submission", async function () {
      await contract.connect(owner).createPuzzle(1, "Gas Test", "Desc", { value: ethers.parseEther("0.01") });

      const tx = await contract.connect(player1).submitSolution(1, 42);
      const receipt = await tx.wait();

      console.log(`Solution submission gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.greaterThan(0);
    });
  });
});
