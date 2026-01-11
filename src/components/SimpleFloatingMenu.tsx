import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import QuickAIChat from "./QuickAIChat";
import SimpleNotes from "./SimpleNotes";

const SimpleFloatingMenu = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const openChat = () => {
    setShowMenu(false);
    setShowAIChat(true);
  };

  const openNotes = () => {
    setShowMenu(false);
    setShowNotes(true);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setShowMenu(!showMenu)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Brain className="h-6 w-6 text-white" />
      </Button>

      {/* Menu Popup */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed bottom-40 right-6 z-50 bg-background border rounded-lg shadow-xl p-2 space-y-2 min-w-[200px]">
            <Button
              onClick={openChat}
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>AI Kompis</span>
            </Button>
            <Button
              onClick={openNotes}
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <Brain className="h-4 w-4" />
              <span>Raskt Notat</span>
            </Button>
          </div>
        </>
      )}

      {/* AI Chat Side Panel */}
      <Sheet open={showAIChat} onOpenChange={setShowAIChat} modal={false}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>AI Kompis</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <QuickAIChat />
          </div>
        </SheetContent>
      </Sheet>

      {/* Notes Side Panel */}
      <Sheet open={showNotes} onOpenChange={setShowNotes} modal={false}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Raskt Notat</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <SimpleNotes />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SimpleFloatingMenu;
