import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Save, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLearningTracking } from "@/hooks/useLearningTracking";

interface Note {
  id: string;
  subject: string;
  content: string;
  timestamp: string;
}

const NotesPage = () => {
  const { trackActivity } = useLearningTracking();
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // All available subjects
  const allSubjects = [
    "Matematikk",
    "Norsk",
    "Engelsk",
    "Naturfag",
    "Samfunnsfag",
    "Geografi",
    "Historie",
    "Religion og etikk",
    "Kroppsøving",
    "Mat og helse",
    "Kunst og håndverk",
    "Musikk",
    "Fysikk",
    "Kjemi",
    "Biologi",
    "Spansk",
    "Tysk",
    "Fransk",
    "Økonomi",
    "Psykologi",
    "Sosiologi",
    "Medie- og informasjonskunnskap",
    "Politikk og menneskerettigheter",
    "Generelt"
  ];

  // Load initial notes from Supabase
  useEffect(() => {
    loadNotesFromSupabase();
  }, []);

  const loadNotesFromSupabase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Du må være logget inn for å se notater");
      return;
    }
    
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (data) {
      const mappedNotes = data.map(n => ({
        id: n.id,
        subject: n.subject,
        content: n.content,
        timestamp: n.created_at
      }));
      setNotes(mappedNotes);
    }
  };

  const saveNote = async () => {
    if (!currentNote.trim() || !selectedSubject) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Du må være logget inn for å lagre notater");
      return;
    }

    try {
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

      const newNote: Note = {
        id: data.id,
        subject: data.subject,
        content: data.content,
        timestamp: data.created_at
      };

      setNotes([newNote, ...notes]);
      
      // Track learning activity
      await trackActivity({
        activityType: 'note',
        subject: selectedSubject,
        metadata: {
          noteLength: currentNote.trim().length,
          wordCount: currentNote.trim().split(/\s+/).length,
          studyType: 'note_taking'
        }
      });
      
      // Clear form
      setCurrentNote("");
      setSelectedSubject("");
      
      toast.success("Notat lagret!");
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Kunne ikke lagre notatet");
    }
  };

  const deleteNote = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Du må være logget inn");
      return;
    }

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== id));
      toast.success("Notat slettet!");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Kunne ikke slette notatet");
    }
  };

  const filteredNotes = filterSubject === "all" 
    ? notes 
    : notes.filter(n => n.subject === filterSubject);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-success/10 p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-success to-primary shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mine Notater</h1>
              <p className="text-muted-foreground">Alle notater organisert etter fag</p>
            </div>
          </div>
        </div>

        {/* New Note */}
        <Card className="p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Nytt notat</h2>
          <div className="space-y-3">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Velg fag for notatet" />
              </SelectTrigger>
              <SelectContent>
                {allSubjects.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Skriv ditt notat her..."
              className="min-h-[120px]"
            />
            
            <Button 
              onClick={saveNote} 
              className="w-full"
              disabled={!currentNote.trim() || !selectedSubject}
            >
              <Save className="h-4 w-4 mr-2" />
              Lagre notat
            </Button>
          </div>
        </Card>

        {/* Filter */}
        <Card className="p-4">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer etter fag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle fag ({notes.length})</SelectItem>
              {allSubjects.map(subject => {
                const count = notes.filter(n => n.subject === subject).length;
                if (count === 0) return null;
                return (
                  <SelectItem key={subject} value={subject}>
                    {subject} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Card>

        {/* Notes List */}
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <Card className="p-12 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filterSubject === "all" 
                  ? "Ingen notater ennå" 
                  : `Ingen notater for ${filterSubject}`
                }
              </h3>
              <p className="text-muted-foreground">
                Skriv ditt første notat ovenfor
              </p>
            </Card>
          ) : (
            filteredNotes.map((note) => (
              <Card key={note.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {note.subject}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.timestamp).toLocaleDateString("no-NO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
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
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
