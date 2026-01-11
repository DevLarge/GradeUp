import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";

interface Note {
  id: string;
  content: string;
  timestamp: string;
}

const SimpleNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("simple_notes");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading notes:", e);
      }
    }
  }, []);

  const saveNote = () => {
    if (!currentNote.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: currentNote.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem("simple_notes", JSON.stringify(updatedNotes));
    setCurrentNote("");
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem("simple_notes", JSON.stringify(updatedNotes));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
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
        >
          <Save className="h-4 w-4 mr-2" />
          Lagre notat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">Ingen notater ennå</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-muted rounded-lg space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1 whitespace-pre-wrap break-words">
                  {note.content}
                </p>
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
                {new Date(note.timestamp).toLocaleDateString("no-NO", {
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

export default SimpleNotes;
