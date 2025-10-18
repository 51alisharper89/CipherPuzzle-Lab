import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock puzzle data
const puzzles = {
  1: {
    title: 'The Genesis Block',
    difficulty: 'Easy' as const,
    reward: '500 points',
    description: 'In the beginning, there was a hash. Find the missing value in this cryptographic sequence.',
    clue: 'SHA-256: d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592 = "The Times 03/Jan/2009 Chancellor on brink of second bailout for ?????"',
    hint: 'Think about Bitcoin\'s genesis block message...',
  },
  2: {
    title: 'Byzantine Consensus',
    difficulty: 'Medium' as const,
    reward: '1000 points',
    description: 'Four generals must agree on an attack time. Can you find the consensus?',
    clue: 'General A: 0x1A3F | General B: 0x2B4E | General C: 0x3C5D | General D: ???',
    hint: 'Look for the pattern in hexadecimal increments...',
  },
};

const PuzzleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const puzzleId = parseInt(id || '1');
  const puzzle = puzzles[puzzleId as keyof typeof puzzles];

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an answer',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    
    // Simulate blockchain submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'Answer Submitted',
      description: 'Your encrypted answer has been recorded on-chain. Results will be revealed after the challenge period.',
    });
    
    setAnswer('');
    setSubmitting(false);
  };

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-glow">Puzzle Not Found</h1>
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
              <div className="flex gap-2">
                <Badge className={difficultyColors[puzzle.difficulty]}>
                  {puzzle.difficulty}
                </Badge>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {puzzle.reward}
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
                disabled={submitting}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 hover:shadow-neon transition-all"
              >
                {submitting ? (
                  'Submitting to Blockchain...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Encrypted Answer
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
