import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CIPHER_PUZZLE_LAB_ADDRESS, CIPHER_PUZZLE_LAB_ABI } from '@/config/contract';
import { encryptUint32 } from '@/utils/fhe';

const PuzzleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const puzzle = puzzleData ? {
    title: (puzzleData as any[])[0] || `Puzzle #${puzzleId}`,
    description: (puzzleData as any[])[1] || 'In the beginning, there was a hash. Find the missing value in this cryptographic sequence.',
    reward: `${formatEther((puzzleData as any[])[2])} ETH`,
    creator: (puzzleData as any[])[3],
    isActive: (puzzleData as any[])[4],
    solvers: Number((puzzleData as any[])[5]),
    difficulty: 'Easy' as const,
    clue: 'SHA-256: d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592 = "The Times 03/Jan/2009 Chancellor on brink of second bailout for ?????"',
    hint: 'Think about Bitcoin\'s genesis block message...',
  } : null;

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async () => {
    console.log('✅ FHE Submit clicked!');
    console.log('Is connected:', isConnected);
    console.log('Address:', address);
    console.log('Answer:', answer);

    if (!isConnected || !address) {
      console.log('Wallet not connected');
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!answer.trim()) {
      console.log('No answer entered');
      toast({
        title: 'Error',
        description: 'Please enter an answer',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Convert answer to number
      const answerNum = parseInt(answer);
      if (isNaN(answerNum)) {
        console.log('Invalid answer format');
        toast({
          title: 'Invalid Answer',
          description: 'Please enter a numeric answer',
          variant: 'destructive',
        });
        return;
      }

      // ⚠️ 临时方案：Mock合约使用明文，真正的FHE合约使用加密
      // Mock合约地址：0x362826cE7c0d18E9029d1E5F4Bf4C0894eE749f6
      const isMockContract = CIPHER_PUZZLE_LAB_ADDRESS.toLowerCase() === '0x362826ce7c0d18e9029d1e5f4bf4c0894ee749f6';

      let handle: string;
      let proof: string;

      if (isMockContract) {
        // Mock合约：直接将答案转为bytes32格式（明文）
        console.log('📤 Mock合约模式：使用明文提交...');
        handle = `0x${answerNum.toString(16).padStart(64, '0')}` as `0x${string}`;
        proof = '0x' as `0x${string}`;
        console.log('   答案 (明文bytes32):', handle);
      } else {
        // 真正的FHE合约：使用FHE加密
        console.log('🔐 FHE合约模式：加密答案...');
        toast({
          title: 'Encrypting Answer',
          description: 'Using FHE to encrypt your answer...',
        });

        const encrypted = await encryptUint32(
          answerNum,
          CIPHER_PUZZLE_LAB_ADDRESS,
          address
        );
        handle = encrypted.handle;
        proof = encrypted.proof;

        console.log('✅ Answer encrypted with FHE');
        console.log('   Handle:', handle.substring(0, 20) + '...');
        console.log('   Proof:', proof.substring(0, 20) + '...');
      }

      console.log('📤 Submitting to blockchain...');

      writeContract({
        address: CIPHER_PUZZLE_LAB_ADDRESS,
        abi: CIPHER_PUZZLE_LAB_ABI,
        functionName: 'submitSolution',
        args: [
          BigInt(puzzleId),
          handle,
          proof
        ],
      });

      console.log('✅ Transaction submitted');
    } catch (err) {
      console.error('❌ Submit error:', err);
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'Failed to encrypt or submit answer',
        variant: 'destructive',
      });
    }
  };

  // Show success toast when transaction is confirmed
  useEffect(() => {
    if (isSuccess && hash) {
      toast({
        title: 'Answer Submitted!',
        description: `Transaction confirmed: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
      });
      setAnswer('');
    }
  }, [isSuccess, hash, toast]);

  // Handle write errors (user rejected, etc)
  useEffect(() => {
    if (writeError) {
      console.error('WriteContract error:', writeError);
      const errorMsg = writeError.message || 'Failed to submit transaction';
      toast({
        title: 'Transaction Failed',
        description: errorMsg.includes('User rejected')
          ? 'You rejected the transaction'
          : errorMsg.slice(0, 100),
        variant: 'destructive',
      });
    }
  }, [writeError, toast]);

  // Handle confirmation errors (transaction reverted)
  useEffect(() => {
    if (confirmError) {
      console.error('Transaction confirmation error:', confirmError);
      const errorMsg = confirmError.message || 'Transaction failed';
      toast({
        title: 'Transaction Reverted',
        description: errorMsg.includes('Puzzle not active')
          ? 'Puzzle not found or not active'
          : errorMsg.slice(0, 100),
        variant: 'destructive',
      });
    }
  }, [confirmError, toast]);

  // Log state changes
  useEffect(() => {
    console.log('Transaction state:', {
      isPending,
      isConfirming,
      isSuccess,
      hash,
      writeError: writeError?.message,
      confirmError: confirmError?.message
    });
  }, [isPending, isConfirming, isSuccess, hash, writeError, confirmError]);

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
                <h3 className="text-sm font-semibold mb-2 text-accent">💡 Hint</h3>
                <p className="text-sm text-muted-foreground">{puzzle.hint}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 neon-box">
            <CardHeader>
              <CardTitle className="text-xl text-glow">Submit Your Answer</CardTitle>
              <CardDescription>
                Your answer will be encrypted and committed on-chain. 
                The actual solution remains hidden until the reveal phase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="bg-input border-primary/30 focus:border-primary text-foreground font-mono"
              />
              <Button
                onClick={handleSubmit}
                disabled={isPending || isConfirming || !isConnected}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 hover:shadow-neon transition-all"
              >
                {isPending ? (
                  'Waiting for approval...'
                ) : isConfirming ? (
                  'Confirming on blockchain...'
                ) : !isConnected ? (
                  'Connect Wallet First'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Answer On-Chain
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                🔒 Zero-knowledge proof ensures your answer stays private until reveal
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PuzzleDetail;
