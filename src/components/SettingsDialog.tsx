import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsDialogProps {
  children?: React.ReactNode;
}

const SettingsDialog = ({ children }: SettingsDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [targetGrade, setTargetGrade] = useState("5");
  const [practiceStyle, setPracticeStyle] = useState("mixed");
  const [learningMethods, setLearningMethods] = useState({
    quizzes: true,
    flashcards: true,
    writtenExercises: false,
    explanations: true,
    practiceTests: false,
    interactiveExercises: false,
    groupStudy: false,
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleMethodChange = (method: keyof typeof learningMethods, checked: boolean) => {
    setLearningMethods(prev => ({ ...prev, [method]: checked }));
  };

  const handleSave = () => {
    // In a real app, these would be saved to localStorage or backend
    console.log("Settings saved:", { targetGrade, practiceStyle, learningMethods });
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logget ut",
        description: "Du er nå logget ut av GradeUp",
      });
      
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Feil ved utlogging",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Innstillinger
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Læringsinnstillinger</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
          <div className="space-y-3">
            <Label>Målkarakter</Label>
            <Select value={targetGrade} onValueChange={setTargetGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Velg målkarakteren din" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 (Utmerket)</SelectItem>
                <SelectItem value="5">5 (Meget godt)</SelectItem>
                <SelectItem value="4">4 (Godt)</SelectItem>
                <SelectItem value="3">3 (Nokså godt)</SelectItem>
                <SelectItem value="2">2 (Lite tilfredsstillende)</SelectItem>
                <SelectItem value="1">1 (Ikke godkjent)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Foretrukne øvingsmetoder</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="quizzes" 
                  checked={learningMethods.quizzes}
                  onCheckedChange={(checked) => handleMethodChange('quizzes', checked as boolean)}
                />
                <Label htmlFor="quizzes" className="text-sm">Quizer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="flashcards" 
                  checked={learningMethods.flashcards}
                  onCheckedChange={(checked) => handleMethodChange('flashcards', checked as boolean)}
                />
                <Label htmlFor="flashcards" className="text-sm">Flashkort</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="writtenExercises" 
                  checked={learningMethods.writtenExercises}
                  onCheckedChange={(checked) => handleMethodChange('writtenExercises', checked as boolean)}
                />
                <Label htmlFor="writtenExercises" className="text-sm">Skrive oppgaver</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="explanations" 
                  checked={learningMethods.explanations}
                  onCheckedChange={(checked) => handleMethodChange('explanations', checked as boolean)}
                />
                <Label htmlFor="explanations" className="text-sm">Forklaringer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="practiceTests" 
                  checked={learningMethods.practiceTests}
                  onCheckedChange={(checked) => handleMethodChange('practiceTests', checked as boolean)}
                />
                <Label htmlFor="practiceTests" className="text-sm">Øvingsprøver</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="interactiveExercises" 
                  checked={learningMethods.interactiveExercises}
                  onCheckedChange={(checked) => handleMethodChange('interactiveExercises', checked as boolean)}
                />
                <Label htmlFor="interactiveExercises" className="text-sm">Interaktive øvelser</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="groupStudy" 
                  checked={learningMethods.groupStudy}
                  onCheckedChange={(checked) => handleMethodChange('groupStudy', checked as boolean)}
                />
                <Label htmlFor="groupStudy" className="text-sm">Gruppestudier</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Hvordan liker du å øve?</Label>
            <RadioGroup value={practiceStyle} onValueChange={setPracticeStyle}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="visual" id="visual" />
                <Label htmlFor="visual" className="text-sm">
                  Visuell lærer - Jeg foretrekker diagrammer og illustrasjoner
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="practical" id="practical" />
                <Label htmlFor="practical" className="text-sm">
                  Praktisk lærer - Jeg lærer best ved å gjøre oppgaver
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reading" id="reading" />
                <Label htmlFor="reading" className="text-sm">
                  Leseorientert lærer - Jeg foretrekker skriftlige forklaringer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="text-sm">
                  Blandet tilnærming - Kombiner ulike metoder
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Avbryt
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Lagre innstillinger
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logg ut
            </Button>
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;