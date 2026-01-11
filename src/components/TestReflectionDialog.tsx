import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, CheckCircle2 } from 'lucide-react';

interface TestReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: {
    id: string;
    title: string;
    subject: string;
    date: Date;
  };
}

export default function TestReflectionDialog({ open, onOpenChange, test }: TestReflectionDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  
  const [howItWent, setHowItWent] = useState<string>('okay');
  const [feltPrepared, setFeltPrepared] = useState<boolean>(true);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [whatHelped, setWhatHelped] = useState('');
  const [whatCouldBeBetter, setWhatCouldBeBetter] = useState('');
  const [wouldChange, setWouldChange] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Du må være logget inn",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-test-reflection', {
        body: {
          userId: user.id,
          testId: test.id,
          testSubject: test.subject,
          testTitle: test.title,
          testDate: test.date,
          howItWent,
          feltPrepared,
          stressLevel,
          whatHelped,
          whatCouldBeBetter,
          wouldChange
        }
      });

      if (error) throw error;

      setInsights(data.insights);
      setShowInsights(true);
      
      toast({
        title: "Takk for refleksjonen!",
        description: "AI-en har lært av dine erfaringer",
      });
    } catch (error) {
      console.error('Error submitting reflection:', error);
      toast({
        title: "Kunne ikke lagre refleksjonen",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowInsights(false);
    // Reset form
    setHowItWent('okay');
    setFeltPrepared(true);
    setStressLevel(3);
    setWhatHelped('');
    setWhatCouldBeBetter('');
    setWouldChange('');
  };

  if (showInsights && insights) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              AI har analysert refleksjonen din
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Motivational Message */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-lg font-medium">{insights.motivationalMessage}</p>
            </div>

            {/* Preparation Insights */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Forberedelser
              </h3>
              <div className="space-y-2 text-sm">
                {insights.preparationInsights.needsEarlierStart && (
                  <p className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
                    💡 <strong>Tips:</strong> Start forberedelsene {insights.preparationInsights.optimalStartDays} dager før neste prøve
                  </p>
                )}
                {insights.preparationInsights.needsMoreTime && (
                  <p className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border-l-4 border-yellow-500">
                    ⏰ Du trenger mer forberedelsetid - vi justerer neste studieplan
                  </p>
                )}
              </div>
            </div>

            {/* Stress Management */}
            {insights.stressManagement.needsStressSupport && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Stresshåndtering</h3>
                <ul className="space-y-2">
                  {insights.stressManagement.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Learning Adjustments */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Tilpasninger til neste gang</h3>
              {insights.learningAdjustments.effectiveMethods.length > 0 && (
                <div>
                  <p className="font-medium text-green-600 mb-1">✓ Hva som fungerte:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {insights.learningAdjustments.effectiveMethods.map((method: string, idx: number) => (
                      <li key={idx}>{method}</li>
                    ))}
                  </ul>
                </div>
              )}
              {insights.learningAdjustments.ineffectiveMethods.length > 0 && (
                <div>
                  <p className="font-medium text-orange-600 mb-1">→ Hva vi justerer:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {insights.learningAdjustments.ineffectiveMethods.map((method: string, idx: number) => (
                      <li key={idx}>{method}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Neste steg</h3>
              <ol className="space-y-2">
                {insights.nextSteps.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Button onClick={handleClose} className="w-full">
              Lukk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hvordan gikk {test.title}?</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">
            Dine svar hjelper AI-en til å tilpasse fremtidig læring til akkurat deg.
          </p>

          {/* How it went */}
          <div className="space-y-3">
            <Label>Hvordan gikk prøven?</Label>
            <RadioGroup value={howItWent} onValueChange={setHowItWent}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very_well" id="very_well" />
                <Label htmlFor="very_well">Veldig bra 🎉</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="well" id="well" />
                <Label htmlFor="well">Bra 👍</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="okay" id="okay" />
                <Label htmlFor="okay">Greit 👌</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="poorly" id="poorly" />
                <Label htmlFor="poorly">Ikke så bra 😕</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very_poorly" id="very_poorly" />
                <Label htmlFor="very_poorly">Dårlig 😟</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Felt prepared */}
          <div className="space-y-3">
            <Label>Følte du deg forberedt?</Label>
            <RadioGroup value={feltPrepared ? 'yes' : 'no'} onValueChange={(v) => setFeltPrepared(v === 'yes')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="prepared_yes" />
                <Label htmlFor="prepared_yes">Ja, jeg følte meg klar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="prepared_no" />
                <Label htmlFor="prepared_no">Nei, jeg trengte mer tid</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Stress level */}
          <div className="space-y-3">
            <Label>Stressnivå (1 = rolig, 5 = veldig stresset)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[stressLevel]}
                onValueChange={(v) => setStressLevel(v[0])}
                min={1}
                max={5}
                step={1}
                className="flex-1"
              />
              <span className="text-2xl font-bold w-8">{stressLevel}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>😌 Rolig</span>
              <span>😰 Stresset</span>
            </div>
          </div>

          {/* What helped */}
          <div className="space-y-3">
            <Label>Hva hjalp mest i forberedelsene?</Label>
            <Textarea
              value={whatHelped}
              onChange={(e) => setWhatHelped(e.target.value)}
              placeholder="F.eks. flashcards, videoer, øvingsoppgaver..."
              rows={3}
            />
          </div>

          {/* What could be better */}
          <div className="space-y-3">
            <Label>Hva kunne vært bedre?</Label>
            <Textarea
              value={whatCouldBeBetter}
              onChange={(e) => setWhatCouldBeBetter(e.target.value)}
              placeholder="Hva ville gjort deg mer forberedt?"
              rows={3}
            />
          </div>

          {/* Would change */}
          <div className="space-y-3">
            <Label>Hva ville du endret til neste gang?</Label>
            <Textarea
              value={wouldChange}
              onChange={(e) => setWouldChange(e.target.value)}
              placeholder="Forberedelsesmetode, tidsbruk, etc..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Analyserer...' : 'Send inn refleksjon'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
