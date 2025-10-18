import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

const leaderboardData = [
  { rank: 1, address: '0x742d...3a4f', score: 15420, puzzlesSolved: 12 },
  { rank: 2, address: '0x8f9a...2b1c', score: 14200, puzzlesSolved: 11 },
  { rank: 3, address: '0x3e5d...7c8e', score: 12800, puzzlesSolved: 10 },
  { rank: 4, address: '0x9a2b...4f6d', score: 11500, puzzlesSolved: 9 },
  { rank: 5, address: '0x5c7e...8a9b', score: 10200, puzzlesSolved: 8 },
  { rank: 6, address: '0x1d4f...3e2a', score: 9100, puzzlesSolved: 7 },
  { rank: 7, address: '0x6b8c...5f7d', score: 8300, puzzlesSolved: 7 },
  { rank: 8, address: '0x4a9e...2c1b', score: 7500, puzzlesSolved: 6 },
];

const Leaderboard = () => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-secondary animate-glow-pulse" />;
      case 2:
        return <Medal className="w-6 h-6 text-primary" />;
      case 3:
        return <Award className="w-6 h-6 text-accent" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-mono">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold mb-4 text-glow">Leaderboard</h1>
            <p className="text-xl text-muted-foreground">
              Top puzzle solvers in the CryptoLogic arena
            </p>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 neon-box">
            <CardHeader>
              <CardTitle className="text-2xl text-glow">Top Solvers</CardTitle>
              <CardDescription>Ranked by total score and puzzles solved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboardData.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-primary/10 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-mono text-primary">{entry.address}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.puzzlesSolved} puzzles solved
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-glow">{entry.score.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
