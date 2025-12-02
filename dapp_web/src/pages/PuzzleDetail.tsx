import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Lock, Loader2, Shield } from 'lucide-react';
import { CIPHER_PUZZLE_LAB_ADDRESS, CIPHER_PUZZLE_LAB_ABI } from '@/config/contract';
import { useSubmitSolutionWithToast } from '@/hooks/usePuzzleActions';
import { toastWarning } from '@/lib/toast-utils';

const PuzzleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [answer, setAnswer] = useState('');

  const puzzleId = parseInt(id || '1');

  // Fetch puzzle data from contract
  const { data: puzzleData, isLoading: isPuzzleLoading } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPuzzle',
    args: [BigInt(puzzleId)],
  });

  // Type the puzzle data properly
  const puzzleArray = puzzleData as readonly [string, string, bigint, `0x${string}`, boolean, bigint] | undefined;

  const puzzle = puzzleArray ? {
    title: puzzleArray[0] || `Puzzle #${puzzleId}`,
    description: puzzleArray[1] || 'Solve this cryptographic puzzle.',
    reward: `${formatEther(puzzleArray[2])} ETH`,
    creator: puzzleArray[3],
    isActive: puzzleArray[4],
    solvers: Number(puzzleArray[5]),
    difficulty: 'Easy' as const,
    clue: 'Use your knowledge of cryptography and blockchain to solve this puzzle.',
    hint: 'Think carefully about the question...',
  } : null;

  // Use the FHE-enabled submit hook
  const { submit, isLoading, isEncrypting, isSuccess } = useSubmitSolutionWithToast();

  const handleSubmit = async () => {
    console.log('FHE Submit clicked!');
    console.log('Is connected:', isConnected);
    console.log('Address:', address);
    console.log('Answer:', answer);

    if (!isConnected || !address) {
      console.log('Wallet not connected');
      toastWarning('Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    if (!answer.trim()) {
      console.log('No answer entered');
      toastWarning('Error', 'Please enter an answer');
      return;
    }

    try {
      // Convert answer to number
      const answerNum = parseInt(answer);
      if (isNaN(answerNum)) {
        console.log('Invalid answer format');
        toastWarning('Invalid Answer', 'Please enter a numeric answer');
        return;
      }

      console.log('Submitting FHE-encrypted answer to blockchain...');
      console.log('   Puzzle ID:', puzzleId);
      console.log('   Answer (will be encrypted):', answerNum);

      // Submit with FHE encryption
      await submit({
        puzzleId: BigInt(puzzleId),
        answer: answerNum,
      });

      // Clear answer on success
      if (isSuccess) {
        setAnswer('');
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  if (isPuzzleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading puzzle data from blockchain...</p>
        </div>
      </div>
    );
  }

  if (!puzzle || !puzzle.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-glow">Puzzle Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {!puzzle ? 'This puzzle does not exist.' : 'This puzzle is not active.'}
          </p>
          <Button onClick={() => navigate('/')} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Puzzles
          </Button>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    Easy: 'bg-primary/20 text-primary border-primary/50',
    Medium: 'bg-accent/20 text-accent border-accent/50',
    Hard: 'bg-secondary/20 text-secondary border-secondary/50',
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-6 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Puzzles
          </Button>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 neon-box mb-6">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <CardTitle className="text-3xl mb-2 text-glow">{puzzle.title}</CardTitle>
                  <CardDescription>Puzzle #{id?.padStart(3, '0')}</CardDescription>
                </div>
                <Lock className="w-8 h-8 text-primary animate-glow-pulse" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className={difficultyColors[puzzle.difficulty]}>
                  {puzzle.difficulty}
                </Badge>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {puzzle.reward}
                </Badge>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  {puzzle.solvers} {puzzle.solvers === 1 ? 'solver' : 'solvers'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Challenge</h3>
                <p className="text-muted-foreground">{puzzle.description}</p>
              </div>

              <div className="p-4 bg-background/50 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold mb-2 text-primary font-mono">Clue:</h3>
                <p className="text-foreground font-mono text-sm">{puzzle.clue}</p>
              </div>

              <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                <h3 className="text-sm font-semibold mb-2 text-accent">Hint</h3>
                <p className="text-sm text-muted-foreground">{puzzle.hint}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 neon-box">
            <CardHeader>
              <CardTitle className="text-xl text-glow flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Submit Your Answer (FHE Encrypted)
              </CardTitle>
              <CardDescription>
                Your answer will be encrypted using Fully Homomorphic Encryption (FHE) before being sent to the blockchain.
                The contract verifies your answer without ever revealing it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="bg-input border-primary/30 focus:border-primary text-foreground font-mono"
                type="number"
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !isConnected}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 hover:shadow-neon transition-all"
              >
                {isEncrypting ? (
                  <>
                    <Shield className="w-4 h-4 mr-2 animate-pulse" />
                    Encrypting with FHE...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : !isConnected ? (
                  'Connect Wallet First'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Encrypted Answer
                  </>
                )}
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Shield className="w-4 h-4 text-primary" />
                <span>Protected by Zama FHE - Your answer remains private on-chain</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PuzzleDetail;
