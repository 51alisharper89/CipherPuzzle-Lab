import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PuzzleCardProps {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reward: string;
  solved: boolean;
  solvers: number;
}

const PuzzleCard = ({ id, title, difficulty, reward, solved, solvers }: PuzzleCardProps) => {
  const difficultyColors = {
    Easy: 'bg-primary/20 text-primary border-primary/50',
    Medium: 'bg-accent/20 text-accent border-accent/50',
    Hard: 'bg-secondary/20 text-secondary border-secondary/50',
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 group neon-box">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 text-glow group-hover:text-glow-magenta transition-all">
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Puzzle #{id.toString().padStart(3, '0')}
            </CardDescription>
          </div>
          {solved ? (
            <Unlock className="w-6 h-6 text-primary animate-glow-pulse" />
          ) : (
            <Lock className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge className={difficultyColors[difficulty]}>
            {difficulty}
          </Badge>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <Trophy className="w-3 h-3 mr-1" />
            {reward}
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {solvers} solver{solvers !== 1 ? 's' : ''}
        </div>

        <Link to={`/puzzle/${id}`}>
          <Button 
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 hover:shadow-neon transition-all"
          >
            {solved ? 'View Solution' : 'Solve Puzzle'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default PuzzleCard;
