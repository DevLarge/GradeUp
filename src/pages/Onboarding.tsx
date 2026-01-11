import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [preferences, setPreferences] = useState({
    learningMethods: [] as string[],
    learningStyle: '',
    studyTimeMinutes: 30,
    optimalStudyTime: '',
    targetGrade: '',
    preparationFrequency: '',
    preparationMethods: [] as string[],
  });

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const learningMethodOptions = [
    { id: 'quizzes', label: 'Quizer' },
    { id: 'flashcards', label: 'Flashkort' },
    { id: 'writing', label: 'Skrive oppgaver' },
    { id: 'explanations', label: 'Forklaringer' },
    { id: 'practice_tests', label: 'Øvingsprøver' },
    { id: 'interactive', label: 'Interaktive øvelser' },
    { id: 'group_study', label: 'Gruppestudier' },
  ];

  const subjectOptions = [
    'Matematikk', 'Norsk', 'Engelsk', 'Naturfag', 'Samfunnsfag',
    'Historie', 'Geografi', 'Musikk', 'Kunst og håndverk', 'Mat og helse',
  ];

  const preparationMethodOptions = [
    { id: 'notes', label: 'Repetere notater' },
    { id: 'quiz', label: 'Gjøre quiz/øvingsoppgaver' },
    { id: 'summary', label: 'Lage sammendrag' },
    { id: 'discuss', label: 'Diskutere med andre' },
    { id: 'textbook', label: 'Lese læreboken' },
    { id: 'past_tests', label: 'Jobbe med tidligere prøver' },
  ];

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_learning_methods: preferences.learningMethods,
          learning_style: preferences.learningStyle,
          average_study_time_minutes: preferences.studyTimeMinutes,
          optimal_study_time: preferences.optimalStudyTime,
          target_grade: preferences.targetGrade,
          preparation_habits: {
            frequency: preferences.preparationFrequency,
            methods: preferences.preparationMethods,
          },
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Velkommen til GradeUp! 🎉',
        description: 'Profilen din er klar. La oss komme i gang!',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Noe gikk galt',
        description: error.message || 'Kunne ikke lagre preferanser',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Velkommen til GradeUp! 🎓</h2>
              <p className="text-muted-foreground">
                La oss tilpasse appen til deg. Dette tar bare 2-3 minutter.
              </p>
            </div>
            <Button onClick={handleNext} className="w-full" size="lg">
              Kom i gang <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Hvordan liker du å øve?</h2>
              <p className="text-sm text-muted-foreground">
                Velg alle som passer for deg
              </p>
            </div>
            <div className="space-y-3">
              {learningMethodOptions.map((method) => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={method.id}
                    checked={preferences.learningMethods.includes(method.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPreferences({
                          ...preferences,
                          learningMethods: [...preferences.learningMethods, method.id],
                        });
                      } else {
                        setPreferences({
                          ...preferences,
                          learningMethods: preferences.learningMethods.filter((m) => m !== method.id),
                        });
                      }
                    }}
                  />
                  <Label htmlFor={method.id} className="cursor-pointer">
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Hva beskriver deg best?</h2>
              <p className="text-sm text-muted-foreground">Velg din læringsstil</p>
            </div>
            <RadioGroup
              value={preferences.learningStyle}
              onValueChange={(value) => setPreferences({ ...preferences, learningStyle: value })}
              className="space-y-3"
            >
              <div className="flex items-start space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="visual" id="visual" />
                <Label htmlFor="visual" className="cursor-pointer flex-1">
                  <div className="font-medium">Visuell lærer</div>
                  <div className="text-sm text-muted-foreground">
                    Jeg foretrekker videoer og diagrammer
                  </div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="practical" id="practical" />
                <Label htmlFor="practical" className="cursor-pointer flex-1">
                  <div className="font-medium">Praktisk lærer</div>
                  <div className="text-sm text-muted-foreground">
                    Jeg lærer best ved å gjøre oppgaver
                  </div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="reading" id="reading" />
                <Label htmlFor="reading" className="cursor-pointer flex-1">
                  <div className="font-medium">Leseorientert lærer</div>
                  <div className="text-sm text-muted-foreground">
                    Jeg foretrekker skriftlige forklaringer
                  </div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="cursor-pointer flex-1">
                  <div className="font-medium">Blandet tilnærming</div>
                  <div className="text-sm text-muted-foreground">
                    Kombiner ulike metoder
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Studietid</h2>
              <p className="text-sm text-muted-foreground">
                Hvor lang tid pleier du å bruke på øving per dag?
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>15 min</span>
                  <span className="font-medium">{preferences.studyTimeMinutes} minutter</span>
                  <span>120 min</span>
                </div>
                <Slider
                  value={[preferences.studyTimeMinutes]}
                  onValueChange={([value]) =>
                    setPreferences({ ...preferences, studyTimeMinutes: value })
                  }
                  min={15}
                  max={120}
                  step={15}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Når på dagen lærer du best?</Label>
                <Select
                  value={preferences.optimalStudyTime}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, optimalStudyTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg tidspunkt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morgen (06:00-12:00)</SelectItem>
                    <SelectItem value="afternoon">Ettermiddag (12:00-18:00)</SelectItem>
                    <SelectItem value="evening">Kveld (18:00-23:00)</SelectItem>
                    <SelectItem value="night">Sent kveld (23:00-06:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Hva er ditt karaktermål?</h2>
              <p className="text-sm text-muted-foreground">Velg det du sikter mot</p>
            </div>
            <RadioGroup
              value={preferences.targetGrade}
              onValueChange={(value) => setPreferences({ ...preferences, targetGrade: value })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="6" id="grade-6" />
                <Label htmlFor="grade-6" className="cursor-pointer flex-1">
                  6 - Utmerket
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="5" id="grade-5" />
                <Label htmlFor="grade-5" className="cursor-pointer flex-1">
                  5 - Meget godt
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="4" id="grade-4" />
                <Label htmlFor="grade-4" className="cursor-pointer flex-1">
                  4 - Godt
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="3" id="grade-3" />
                <Label htmlFor="grade-3" className="cursor-pointer flex-1">
                  3 - Nokså godt
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <RadioGroupItem value="pass" id="grade-pass" />
                <Label htmlFor="grade-pass" className="cursor-pointer flex-1">
                  Bare bestå
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Forberedelsesrutiner</h2>
              <p className="text-sm text-muted-foreground">
                Pleier du å føre deg forberedt til prøver?
              </p>
            </div>
            
            <div className="space-y-4">
              <RadioGroup
                value={preferences.preparationFrequency}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, preparationFrequency: value })
                }
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="always" id="always" />
                  <Label htmlFor="always" className="cursor-pointer">Ja, alltid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="usually" id="usually" />
                  <Label htmlFor="usually" className="cursor-pointer">Vanligvis</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sometimes" id="sometimes" />
                  <Label htmlFor="sometimes" className="cursor-pointer">Noen ganger</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rarely" id="rarely" />
                  <Label htmlFor="rarely" className="cursor-pointer">Sjelden</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never" className="cursor-pointer">Nei</Label>
                </div>
              </RadioGroup>

              <div className="space-y-3 pt-4">
                <Label>Hva hjelper deg mest før en prøve?</Label>
                {preparationMethodOptions.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={method.id}
                      checked={preferences.preparationMethods.includes(method.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPreferences({
                            ...preferences,
                            preparationMethods: [...preferences.preparationMethods, method.id],
                          });
                        } else {
                          setPreferences({
                            ...preferences,
                            preparationMethods: preferences.preparationMethods.filter(
                              (m) => m !== method.id
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={method.id} className="cursor-pointer">
                      {method.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return preferences.learningMethods.length > 0;
      case 3:
        return preferences.learningStyle !== '';
      case 4:
        return preferences.optimalStudyTime !== '';
      case 5:
        return preferences.targetGrade !== '';
      case 6:
        return preferences.preparationFrequency !== '';
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8">
        <Progress value={progress} className="mb-8" />
        
        <Card>
          <CardHeader>
            <div className="text-sm text-muted-foreground mb-2">
              Steg {step} av {totalSteps}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}

            {step > 1 && (
              <div className="flex gap-3">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tilbake
                </Button>
                {step < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                    disabled={!canProceed() || loading}
                  >
                    Neste <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    className="flex-1"
                    disabled={!canProceed() || loading}
                  >
                    {loading ? 'Lagrer...' : 'Fullfør'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
