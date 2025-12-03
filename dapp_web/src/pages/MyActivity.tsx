import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Wallet,
  ExternalLink,
  Target,
  Award
} from 'lucide-react';
import { CIPHER_PUZZLE_LAB_ADDRESS, CIPHER_PUZZLE_LAB_ABI } from '@/config/contract';

interface SolvedPuzzle {
  puzzleId: number;
  title: string;
  reward: string;
  transactionHash: string;
  blockNumber: bigint;
  timestamp?: number;
}

const MyActivity = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [solvedPuzzles, setSolvedPuzzles] = useState<SolvedPuzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get user's total points
  const { data: userPoints } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPlayerPoints',
    args: address ? [address] : undefined,
  });

  // Fetch puzzle data for each solved puzzle
  const fetchPuzzleData = async (puzzleId: number): Promise<{ title: string; reward: string } | null> => {
    if (!publicClient) return null;

    try {
      const data = await publicClient.readContract({
        address: CIPHER_PUZZLE_LAB_ADDRESS,
        abi: CIPHER_PUZZLE_LAB_ABI,
        functionName: 'getPuzzle',
        args: [BigInt(puzzleId)],
      } as const as any) as readonly [string, string, bigint, `0x${string}`, boolean, bigint];

      return {
        title: data[0] || `Puzzle #${puzzleId}`,
        reward: formatEther(data[2]),
      };
    } catch (error) {
      console.error(`Error fetching puzzle ${puzzleId}:`, error);
      return null;
    }
  };

  // Fetch user's solved puzzles from events
  useEffect(() => {
    const fetchSolvedPuzzles = async () => {
      if (!address || !publicClient) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Get current block number to calculate a reasonable starting point
        const currentBlock = await publicClient.getBlockNumber();
        // Search last 100000 blocks (roughly 2 weeks on Sepolia)
        const fromBlock = currentBlock > 100000n ? currentBlock - 100000n : 0n;

        // Get PuzzleSolved events for this user
        const logs = await publicClient.getLogs({
          address: CIPHER_PUZZLE_LAB_ADDRESS,
          event: {
            type: 'event',
            name: 'PuzzleSolved',
            inputs: [
              { type: 'uint256', name: 'puzzleId', indexed: true },
              { type: 'address', name: 'solver', indexed: true },
              { type: 'bool', name: 'isCorrect', indexed: false },
            ],
          },
          args: {
            solver: address,
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Process each log and fetch puzzle details
        const puzzlesWithDetails: SolvedPuzzle[] = [];

        for (const log of logs) {
          // Only include successful solutions
          const isCorrect = log.args.isCorrect as boolean;
          if (!isCorrect) continue;

          const puzzleId = Number(log.args.puzzleId);
          const puzzleData = await fetchPuzzleData(puzzleId);

          if (puzzleData) {
            puzzlesWithDetails.push({
              puzzleId,
              title: puzzleData.title,
              reward: `${puzzleData.reward} ETH`,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            });
          }
        }

        // Sort by block number (most recent first)
        puzzlesWithDetails.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        setSolvedPuzzles(puzzlesWithDetails);
      } catch (error) {
        console.error('Error fetching solved puzzles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolvedPuzzles();
  }, [address, publicClient]);

  const totalPoints = userPoints ? Number(userPoints) : 0;
  const totalRewards = solvedPuzzles.reduce((acc, puzzle) => {
    const reward = parseFloat(puzzle.reward.replace(' ETH', ''));
    return acc + reward;
  }, 0);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <Wallet className="w-20 h-20 mx-auto mb-6 text-primary/40" />
              <h1 className="text-4xl font-bold mb-4 text-glow">Connect Your Wallet</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect your wallet to view your puzzle solving activity
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold mb-4 text-glow">My Activity</h1>
            <p className="text-xl text-muted-foreground">
              Track your puzzle solving journey
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-3xl font-bold text-primary">{totalPoints}</p>
                  </div>
                  <Trophy className="w-10 h-10 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-secondary/20 hover:border-secondary/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Puzzles Solved</p>
                    <p className="text-3xl font-bold text-secondary">{solvedPuzzles.length}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-secondary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-accent/20 hover:border-accent/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rewards</p>
                    <p className="text-3xl font-bold text-accent">{totalRewards.toFixed(4)}</p>
                  </div>
                  <Award className="w-10 h-10 text-accent/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Solved Puzzles List */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 neon-box">
            <CardHeader>
              <CardTitle className="text-2xl text-glow flex items-center gap-2">
                <Target className="w-6 h-6" />
                Solved Puzzles
              </CardTitle>
              <CardDescription>
                Your complete puzzle solving history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading your activity from blockchain...</p>
                </div>
              ) : solvedPuzzles.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-xl font-semibold text-muted-foreground mb-2">No puzzles solved yet</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Start solving puzzles to see your activity here
                  </p>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50"
                  >
                    Browse Puzzles
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {solvedPuzzles.map((puzzle, index) => (
                    <div
                      key={`${puzzle.puzzleId}-${puzzle.transactionHash}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-primary/10 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-bold">#{puzzle.puzzleId}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{puzzle.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Block #{puzzle.blockNumber.toString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {puzzle.reward}
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Solved
                        </Badge>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${puzzle.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary/60 hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Info */}
          <Card className="mt-6 bg-card/30 backdrop-blur-sm border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Connected Wallet:</span>
                  <code className="text-sm text-primary font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </code>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                >
                  View on Etherscan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MyActivity;
