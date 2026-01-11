import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const ApiKeySettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('anthropic_api_key');
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Feil",
        description: "Vennligst legg inn en gyldig API-nøkkel",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('anthropic_api_key', apiKey.trim());
    toast({
      title: "Lagret!",
      description: "API-nøkkelen er lagret og AI-funksjoner er aktivert",
    });
    setIsOpen(false);
  };

  const handleRemove = () => {
    localStorage.removeItem('anthropic_api_key');
    setApiKey("");
    toast({
      title: "Fjernet",
      description: "API-nøkkelen er fjernet. Demo-modus aktivert.",
    });
  };

  const hasApiKey = localStorage.getItem('anthropic_api_key');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={hasApiKey ? "default" : "outline"} size="sm">
          <Key className="h-4 w-4 mr-2" />
          {hasApiKey ? "AI Aktivert" : "Sett opp AI"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI API-innstillinger
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Trenger du en API-nøkkel fra Anthropic (Claude) for full AI-funksjonalitet.
              Uten denne kjører systemet i demo-modus.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="apikey">Anthropic API-nøkkel</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Avbryt
            </Button>
            {hasApiKey && (
              <Button variant="destructive" onClick={handleRemove} className="flex-1">
                Fjern nøkkel
              </Button>
            )}
            <Button onClick={handleSave} className="flex-1">
              Lagre
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Få din API-nøkkel på: <a href="https://console.anthropic.com" target="_blank" className="text-primary hover:underline">console.anthropic.com</a></p>
            <p className="mt-1">Nøkkelen lagres sikkert i din nettleser.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySettings;