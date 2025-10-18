import { useState } from 'react';
import Navbar from '@/components/Navbar';
import PuzzleCard from '@/components/PuzzleCard';
import { Brain, Shield, Zap } from 'lucide-react';

const puzzlesData = [
  {
    id: 1,
    title: 'The Genesis Block',
    difficulty: 'Easy' as const,
    reward: '500 points',
    solved: false,
    solvers: 247,
  },
  {
    id: 2,
    title: 'Byzantine Consensus',
    difficulty: 'Medium' as const,
    reward: '1000 points',
    solved: false,
    solvers: 89,
  },
  {
    id: 3,
    title: 'Hash Collision',
    difficulty: 'Hard' as const,
    reward: '2500 points',
    solved: false,
    solvers: 12,
  },
  {
    id: 4,
    title: 'Merkle Tree Mystery',
    difficulty: 'Medium' as const,
    reward: '1200 points',
    solved: true,
    solvers: 156,
  },
  {
    id: 5,
    title: 'Smart Contract Riddle',
    difficulty: 'Easy' as const,
    reward: '600 points',
    solved: false,
    solvers: 203,
  },
  {
    id: 6,
    title: 'Zero Knowledge Proof',
    difficulty: 'Hard' as const,
    reward: '3000 points',
    solved: false,
    solvers: 8,
  },
];

const Index = () => {
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  const filteredPuzzles = filter === 'All' 
    ? puzzlesData 
    : puzzlesData.filter(p => p.difficulty === filter);

  return (
    <div className="min-h-screen relative">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-glow">
            CryptoLogic Puzzles
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Solve cryptographic puzzles. Prove your solution on-chain. 
            <br />
            <span className="text-primary">Zero-knowledge. Maximum security.</span>
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-glow-pulse" />
              <h3 className="text-lg font-semibold mb-2 text-glow">Logic Challenges</h3>
              <p className="text-sm text-muted-foreground">
                Test your problem-solving skills with cryptographic puzzles
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <Shield className="w-12 h-12 text-secondary mx-auto mb-4 animate-glow-pulse" />
              <h3 className="text-lg font-semibold mb-2 text-glow-magenta">Private Answers</h3>
              <p className="text-sm text-muted-foreground">
                Submit encrypted solutions without revealing your answer
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--accent))' }}>Fair Competition</h3>
              <p className="text-sm text-muted-foreground">
                Blockchain-verified results ensure complete fairness
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
