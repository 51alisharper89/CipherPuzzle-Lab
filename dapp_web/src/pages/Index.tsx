import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import Navbar from '@/components/Navbar';
import PuzzleCard from '@/components/PuzzleCard';
import { Brain, Shield, Zap } from 'lucide-react';
import { CIPHER_PUZZLE_LAB_ADDRESS, CIPHER_PUZZLE_LAB_ABI } from '@/config/contract';

interface Puzzle {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reward: string;
  solved: boolean;
  solvers: number;
}

const Index = () => {
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);

  // Get total puzzles count
  const { data: totalPuzzles } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'totalPuzzles',
  });

  // Fetch puzzle data for puzzles 1-11 using multiple useReadContract hooks
  const { data: puzzle1Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(1)],
  });

  const { data: puzzle2Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(2)],
  });

  const { data: puzzle3Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(3)],
  });

  const { data: puzzle4Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(4)],
  });

  const { data: puzzle5Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(5)],
  });

  const { data: puzzle6Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(6)],
  });

  const { data: puzzle7Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(7)],
  });

  const { data: puzzle8Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(8)],
  });

  const { data: puzzle9Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(9)],
  });

  const { data: puzzle10Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(10)],
  });

  const { data: puzzle11Data } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(11)],
  });

  // Process all puzzle data
  useEffect(() => {
    const allPuzzleData = [
      puzzle1Data,
      puzzle2Data,
      puzzle3Data,
      puzzle4Data,
      puzzle5Data,
      puzzle6Data,
      puzzle7Data,
      puzzle8Data,
      puzzle9Data,
      puzzle10Data,
      puzzle11Data,
    ];

    const processedPuzzles: Puzzle[] = [];

    allPuzzleData.forEach((puzzleData, index) => {
      if (puzzleData) {
        // Type the puzzle data properly
        const puzzleArray = puzzleData as readonly [string, string, bigint, `0x${string}`, boolean, bigint];
        const [title, , reward, , isActive, solvers] = puzzleArray;
        const puzzleId = index + 1;

        // Determine difficulty based on reward
        let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
        const rewardEth = parseFloat(formatEther(reward));
        if (rewardEth <= 0.015) difficulty = 'Easy';
        else if (rewardEth >= 0.025) difficulty = 'Hard';

        processedPuzzles.push({
          id: puzzleId,
          title: title || `Puzzle #${puzzleId}`,
          difficulty,
          reward: `${formatEther(reward)} ETH`,
          solved: !isActive,
          solvers: Number(solvers),
        });
      }
    });

    if (processedPuzzles.length > 0) {
      setPuzzles(processedPuzzles);
    }
  }, [puzzle1Data, puzzle2Data, puzzle3Data, puzzle4Data, puzzle5Data, puzzle6Data, puzzle7Data, puzzle8Data, puzzle9Data, puzzle10Data, puzzle11Data]);

  const filteredPuzzles = filter === 'All'
    ? puzzles
    : puzzles.filter(p => p.difficulty === filter);

  return (
    <div className="min-h-screen relative">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-glow">
            EnigmaVault
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Unlock encrypted puzzles with your mind. Compete with complete privacy.
            <br />
            <span className="text-primary">Powered by Zama FHE · Built for fairness</span>
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-glow-pulse" />
              <h3 className="text-lg font-semibold mb-2 text-glow">Mind-Bending Puzzles</h3>
              <p className="text-sm text-muted-foreground">
                Challenge yourself with encrypted logic puzzles and earn rewards
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <Shield className="w-12 h-12 text-secondary mx-auto mb-4 animate-glow-pulse" />
              <h3 className="text-lg font-semibold mb-2 text-glow-magenta">Fully Encrypted</h3>
              <p className="text-sm text-muted-foreground">
                Your answers stay encrypted on-chain using Zama's FHE technology
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--accent))' }}>Provably Fair</h3>
              <p className="text-sm text-muted-foreground">
                Smart contracts verify correctness without revealing solutions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Puzzles Section */}
      <section className="container mx-auto px-4 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-glow">Active Puzzles</h2>
            
            <div className="flex gap-2">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filter === level
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'bg-card/50 text-muted-foreground border border-primary/20 hover:border-primary/40'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPuzzles.map((puzzle) => (
              <PuzzleCard key={puzzle.id} {...puzzle} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
