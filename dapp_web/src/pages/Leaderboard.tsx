import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Loader2, User } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { CIPHER_PUZZLE_LAB_ADDRESS, CIPHER_PUZZLE_LAB_ABI } from '@/config/contract';
import { Badge } from '@/components/ui/badge';

const Leaderboard = () => {
  const { address, isConnected } = useAccount();

  // Fetch current user's points from contract
  const { data: userPoints, isLoading: isLoadingPoints } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getPlayerPoints',
    args: address ? [address] : undefined,
  });

  const currentUserScore = userPoints ? Number(userPoints) : 0;

  // Fetch top 10 players from contract
  const { data: topPlayersData, isLoading: isLoadingLeaderboard } = useReadContract({
    address: CIPHER_PUZZLE_LAB_ADDRESS,
    abi: CIPHER_PUZZLE_LAB_ABI,
    functionName: 'getTopPlayers',
    args: [BigInt(10)],
  });

  const leaderboardEntries = topPlayersData
    ? (topPlayersData[0] as readonly `0x${string}`[]).map((addr, index) => ({
        rank: index + 1,
        address: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
        fullAddress: addr,
        score: Number((topPlayersData[1] as readonly bigint[])[index]),
      }))
    : [];

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
              <CardTitle className="text-2xl text-glow">Global Leaderboard</CardTitle>
              <CardDescription>Top 10 puzzle solvers ranked by points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-muted-foreground">
                <Trophy className="w-20 h-20 mx-auto mb-6 text-primary/40 animate-pulse" />
                <p className="text-2xl font-semibold mb-3 text-foreground">Coming Soon</p>
                <p className="text-lg mb-2">We're working hard to bring you the leaderboard!</p>
                <p className="text-sm max-w-md mx-auto text-muted-foreground/80">
                  The scoring system is currently being optimized for FHE encrypted submissions.
                  Stay tuned for updates!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
