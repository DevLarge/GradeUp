import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCheck, TrendingUp, MessageSquare, Brain } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import QuickAIChat from "./QuickAIChat";
import Notes from "./Notes";

const FloatingAIChat = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "notes" | null>(null);

  const openChat = () => {
    setShowMenu(false);
    setActiveView("chat");
  };

  const openNotes = () => {
    setShowMenu(false);
    setActiveView("notes");
  };

  const closeSheet = () => {
    setActiveView(null);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setShowMenu(!showMenu)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-gradient-to-br from-primary via-violet to-cyan"
        size="lg"
      >
        <Brain className="h-6 w-6 text-white drop-shadow-lg" />
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
              <span>Rask AI chat</span>
            </Button>
            <Button
              onClick={openNotes}
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <Brain className="h-4 w-4 text-primary" />
              <span>Notater</span>
            </Button>
          </div>
        </>
      )}

      {/* Single Sheet - always rendered but controlled by open prop */}
      <Sheet open={activeView !== null} onOpenChange={closeSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          {activeView && (
            <>
              <SheetHeader className="p-4 border-b">
                <SheetTitle>
                  {activeView === "chat" ? "Rask AI Chat" : "Mine Notater"}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                {activeView === "chat" ? <QuickAIChat /> : <Notes />}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FloatingAIChat;