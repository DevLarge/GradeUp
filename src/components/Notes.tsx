import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTestContext } from "@/contexts/TestContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Note {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { tests } = useTestContext();

  // Get unique subjects from tests
  const subjects = Array.from(new Set(tests.map(t => t.subject)));

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If no user, try to load from localStorage as fallback
        const savedNotes = localStorage.getItem("study_notes");
        if (savedNotes) {
          const parsed = JSON.parse(savedNotes);
          setNotes(parsed);
        }
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const saveNote = async () => {
    if (!currentNote.trim()) {
      toast({
        title: "Tomt notat",
        description: "Skriv noe før du lagrer",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSubject) {
      toast({
        title: "Velg fag",
        description: "Du må velge hvilket fag notatet tilhører",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Fallback to localStorage if no user
        const newNote = {
          id: Date.now().toString(),
          subject: selectedSubject,
          content: currentNote.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem("study_notes", JSON.stringify(updatedNotes));
        setCurrentNote("");
        setSelectedSubject("");
        
        toast({
          title: "Lagret!",
          description: "Notatet ditt er lagret lokalt"
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          subject: selectedSubject,
          content: currentNote.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setCurrentNote("");
      setSelectedSubject("");
      
      toast({
        title: "Lagret!",
        description: "Notatet ditt er lagret"
      });
    } catch (error: any) {
      console.error("Error saving note:", error);
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke lagre notatet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Fallback to localStorage
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        localStorage.setItem("study_notes", JSON.stringify(updatedNotes));
        
        toast({
          title: "Slettet",
          description: "Notatet er fjernet"
        });
        return;
      }

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== id));
      
      toast({
        title: "Slettet",
        description: "Notatet er fjernet"
      });
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke slette notatet",
        variant: "destructive"
      });
    }
  };

  const filteredNotes = filterSubject === "all" 
    ? notes 
    : notes.filter(n => n.subject === filterSubject);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger>
            <SelectValue placeholder="Velg fag for notatet" />
          </SelectTrigger>
          <SelectContent>
            {subjects.length === 0 ? (
              <SelectItem value="generelt">Generelt</SelectItem>
            ) : (
              subjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder="Skriv et nytt notat..."
          className="min-h-[100px]"
        />
        
        <Button 
          onClick={saveNote} 
          className="w-full"
          size="sm"
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Lagrer..." : "Lagre notat"}
        </Button>
      </div>

      <div className="p-4 border-b">
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrer etter fag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle fag</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">
              {filterSubject === "all" 
                ? "Ingen notater ennå" 
                : `Ingen notater for ${filterSubject}`
              }
            </p>
            <p className="text-xs mt-1">Skriv ditt første notat ovenfor</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-muted rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-primary">
                      {note.subject}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote(note.id)}
                  className="flex-shrink-0 h-8 w-8 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(note.created_at).toLocaleDateString("no-NO", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notes;
