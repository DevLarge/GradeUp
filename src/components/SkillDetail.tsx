import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Play, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ArrowLeft,
  Video,
  FileText
} from "lucide-react";

interface Example {
  id: string;
  title: string;
  problem: string;
  solution: string[];
  difficulty: "Easy" | "Medium" | "Hard";
}

const mockSkillData = {
  "1": {
    name: "Lineære ligninger",
    subject: "Matematikk",
    mastery: 85,
    description: "Mestre løsning av lineære ligninger med én variabel ved hjelp av ulike algebraiske metoder.",
    lastPracticed: "2 dager siden",
    totalQuestions: 45,
    correctAnswers: 38,
    nextSteps: [
      "Øv på avanserte tekstoppgaver",
      "Repeter grafisk fremstilling av lineære ligninger",
      "Ta endelig mestringsquiz"
    ],
    examples: [
      {
        id: "1",
        title: "Grunnleggende lineær likning",
        problem: "Løs: 3x - 7 = 14",
        solution: [
          "Legg til 7 på begge sider: 3x - 7 + 7 = 14 + 7",
          "Forenkle: 3x = 21", 
          "Del begge sider på 3: x = 7"
        ],
        difficulty: "Lett" as const
      },
      {
        id: "2", 
        title: "Likning med brøker",
        problem: "Løs: (2x + 1)/3 = 5",
        solution: [
          "Gang begge sider med 3: 2x + 1 = 15",
          "Trekk fra 1 på begge sider: 2x = 14",
          "Del på 2: x = 7"
        ],
        difficulty: "Middels" as const
      }
    ]
  },
  "2": {
    name: "Andregradsfunksjoner", 
    subject: "Matematikk",
    mastery: 42,
    description: "Lær å arbeide med andregradsfunksjoner, deres grafer og løse andregradsligninger.",
    lastPracticed: "1 uke siden",
    totalQuestions: 28,
    correctAnswers: 12,
    nextSteps: [
      "Se introduksjonsvideo",
      "Øv på grunnleggende faktorisering",
      "Arbeid gjennom veiledte eksempler",
      "Ta målrettet quiz"
    ],
    examples: [
      {
        id: "1",
        title: "Standardform",
        problem: "Identifiser a, b, c i: 2x² - 5x + 3 = 0",
        solution: [
          "Standardform er ax² + bx + c = 0",
          "Sammenligner: a = 2, b = -5, c = 3"
        ],
        difficulty: "Lett" as const
      }
    ]
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Lett": return "bg-success text-success-foreground";
    case "Middels": return "bg-warning text-warning-foreground";
    case "Vanskelig": return "bg-destructive text-destructive-foreground";
    default: return "bg-secondary text-secondary-foreground";
  }
};

const getMasteryColor = (mastery: number) => {
  if (mastery >= 80) return "success";
  if (mastery >= 50) return "warning";
  return "destructive";
};

const SkillDetail = () => {
  const { id } = useParams();
  const skill = mockSkillData[id as keyof typeof mockSkillData];

  if (!skill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ferdighet ikke funnet</h1>
          <Link to="/">
            <Button>Tilbake til oversikt</Button>
          </Link>
        </div>
      </div>
    );
  }

  const masteryColor = getMasteryColor(skill.mastery);
  const accuracyRate = Math.round((skill.correctAnswers / skill.totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Oversikt
            </Button>
          </Link>
          <Badge variant="secondary">{skill.subject}</Badge>
        </div>

        {/* Skill Overview */}
        <Card className="p-8 shadow-lg">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-3">{skill.name}</h1>
                <p className="text-muted-foreground text-lg">{skill.description}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Nåværende mestring</span>
                  <Badge className={
                    masteryColor === 'success' ? 'bg-success text-success-foreground' :
                    masteryColor === 'warning' ? 'bg-warning text-warning-foreground' :
                    'bg-destructive text-destructive-foreground'
                  }>
                    {skill.mastery}%
                  </Badge>
                </div>
                <Progress 
                  value={skill.mastery}
                  className={`h-3 ${
                    masteryColor === 'success' ? '[&>div]:bg-success' :
                    masteryColor === 'warning' ? '[&>div]:bg-warning' :
                    '[&>div]:bg-destructive'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{skill.totalQuestions}</div>
                  <div className="text-sm text-muted-foreground">Spørsmål forsøkt</div>
                </div>
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-success">{accuracyRate}%</div>
                  <div className="text-sm text-muted-foreground">Nøyaktighet</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Anbefalte neste steg</h3>
                </div>
                <ul className="space-y-2">
                  {skill.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Sist øvd {skill.lastPracticed}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/quiz">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="text-center space-y-3">
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors inline-block">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Målrettet quiz</h3>
                <p className="text-sm text-muted-foreground">Øv på denne ferdigheten spesifikt</p>
              </div>
            </Card>
          </Link>

          <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group bg-gradient-to-r from-success/5 to-success/10">
            <div className="text-center space-y-3">
              <div className="p-3 rounded-full bg-success/10 group-hover:bg-success/20 transition-colors inline-block">
                <Video className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold">Se video</h3>
              <p className="text-sm text-muted-foreground">Visuell forklaring og eksempler</p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group bg-gradient-to-r from-secondary/50 to-secondary/30">
            <div className="text-center space-y-3">
              <div className="p-3 rounded-full bg-secondary group-hover:bg-secondary/80 transition-colors inline-block">
                <FileText className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold">Studieveiledning</h3>
              <p className="text-sm text-muted-foreground">Nøkkelbegreper og formler</p>
            </div>
          </Card>
        </div>

        {/* Examples */}
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Løste eksempler</h2>
          </div>
          
          <div className="space-y-6">
            {skill.examples.map((example, index) => (
              <Card key={example.id} className="p-6 border-l-4 border-l-primary">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{example.title}</h3>
                    <Badge className={getDifficultyColor(example.difficulty)}>
                      {example.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="bg-secondary/30 p-4 rounded-lg">
                    <p className="font-medium text-secondary-foreground">{example.problem}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Løsning:</h4>
                    <ol className="space-y-2">
                      {example.solution.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full text-sm flex items-center justify-center font-medium">
                            {stepIndex + 1}
                          </span>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SkillDetail;