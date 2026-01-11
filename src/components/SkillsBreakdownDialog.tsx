import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Target, BookOpen, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface Skill {
  id: string;
  name: string;
  subject: string;
  mastery: number;
  lastPracticed: string;
  hasContent: boolean;
}

interface SkillsBreakdownDialogProps {
  skills: Skill[];
  overallReadiness: number;
  children: React.ReactNode;
}

const getMasteryColor = (mastery: number) => {
  if (mastery >= 80) return "emerald";
  if (mastery >= 60) return "cyan";
  if (mastery >= 40) return "orange";
  return "destructive";
};

const getMasteryIcon = (mastery: number) => {
  if (mastery >= 80) return <Target className="h-4 w-4" />;
  if (mastery >= 60) return <TrendingUp className="h-4 w-4" />;
  if (mastery >= 40) return <Brain className="h-4 w-4" />;
  return <Zap className="h-4 w-4" />;
};

const getMasteryText = (mastery: number) => {
  if (mastery >= 80) return "Mestret";
  if (mastery >= 60) return "God fremgang";
  if (mastery >= 40) return "Arbeider med";
  return "Trenger øving";
};

const SkillsBreakdownDialog = ({ skills, overallReadiness, children }: SkillsBreakdownDialogProps) => {
  const sortedSkills = [...skills].sort((a, b) => b.mastery - a.mastery);
  const subjectGroups = skills.reduce((acc, skill) => {
    if (!acc[skill.subject]) {
      acc[skill.subject] = [];
    }
    acc[skill.subject].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-6 w-6 text-primary" />
            Detaljert kompetanseoversikt
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Summary */}
          <Card className="p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-r from-primary to-secondary">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Total prøveklarhet</h3>
                  <p className="text-muted-foreground">Basert på alle registrerte fag</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{overallReadiness}%</div>
                <Badge variant="outline" className="mt-1">
                  {skills.length} kompetanser
                </Badge>
              </div>
            </div>
            <Progress value={overallReadiness} className="h-3" />
          </Card>

          {/* Subject Groups */}
          {Object.entries(subjectGroups).map(([subject, subjectSkills]) => {
            const avgMastery = Math.round(subjectSkills.reduce((sum, skill) => sum + skill.mastery, 0) / subjectSkills.length);
            
            return (
              <Card key={subject} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-secondary" />
                    <h3 className="font-semibold text-lg">{subject}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={avgMastery} className="w-20 h-2" />
                    <Badge variant="outline">{avgMastery}%</Badge>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {subjectSkills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-${getMasteryColor(skill.mastery)}/10`}>
                          {getMasteryIcon(skill.mastery)}
                        </div>
                        <div>
                          <h4 className="font-medium">{skill.name}</h4>
                          <p className="text-sm text-muted-foreground">{skill.lastPracticed}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`bg-${getMasteryColor(skill.mastery)}/10 text-${getMasteryColor(skill.mastery)} border-${getMasteryColor(skill.mastery)}/20`}
                        >
                          {getMasteryText(skill.mastery)}
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold">{skill.mastery}%</div>
                          <Progress value={skill.mastery} className="w-16 h-1 mt-1" />
                        </div>
                        {skill.hasContent && (
                          <Link to="/tests">
                            <Button size="sm" variant="outline">
                              Øv
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {/* Recommendations */}
          <Card className="p-6 bg-gradient-to-r from-orange/5 to-accent/5 border-orange/20">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-orange" />
              <h3 className="font-semibold">Anbefalinger</h3>
            </div>
            
            <div className="space-y-2">
              {sortedSkills.filter(s => s.mastery < 80).slice(0, 3).map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-2 bg-white/50 rounded">
                  <span className="text-sm">Prioriter øving i <strong>{skill.name}</strong></span>
                  <Badge variant="outline">{skill.mastery}%</Badge>
                </div>
              ))}
              
              {sortedSkills.filter(s => s.mastery < 80).length === 0 && (
                <p className="text-sm text-muted-foreground">🎉 Flott! Du mestrer alle registrerte kompetanser!</p>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillsBreakdownDialog;