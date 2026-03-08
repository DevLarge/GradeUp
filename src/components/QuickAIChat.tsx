import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const QuickAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hei! Still meg et raskt spørsmål om studiene dine.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveConversationAsNote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Du må være logget inn for å lagre notater");
      return;
    }
    
    const conversationText = messages
      .filter(m => m.type === "user" || m.type === "ai")
      .map(m => `${m.type === "user" ? "Meg" : "AI"}: ${m.content}`)
      .join("\n\n");
    
    try {
      const { error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          subject: "Samtale",
          content: conversationText
        });

      if (error) throw error;
      toast.success("Samtale lagret i Mine Notater!");
    } catch (error) {
      console.error("Error saving conversation:", error);
      toast.error("Kunne ikke lagre samtalen");
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [
            ...messages.filter(m => m.type === "user" || m.type === "ai").map(m => ({
              role: m.type === "user" ? "user" : "assistant",
              content: m.content
            })),
            { role: "user", content: messageToSend }
          ] 
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      if (!resp.body) {
        throw new Error("Response body is empty");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let aiMessageContent = "";
      let aiMessageId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: aiMessageId,
        type: "ai",
        content: "",
        timestamp: new Date()
      }]);
      setIsLoading(false);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              aiMessageContent += content;
              setMessages(prev => prev.map(m => 
                m.id === aiMessageId 
                  ? { ...m, content: aiMessageContent }
                  : m
              ));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              aiMessageContent += content;
              setMessages(prev => prev.map(m => 
                m.id === aiMessageId 
                  ? { ...m, content: aiMessageContent }
                  : m
              ));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Beklager, det oppstod en feil. Vennligst prøv igjen.",
        timestamp: new Date()
      }]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.type === "ai" && (
                <div className="p-1.5 rounded-full bg-primary/10 self-start flex-shrink-0">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-2.5 rounded-lg text-sm ${
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
              {message.type === "user" && (
                <div className="p-1.5 rounded-full bg-primary/10 self-start flex-shrink-0">
                  <User className="h-3 w-3 text-primary" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="p-1.5 rounded-full bg-primary/10">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-muted p-2.5 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-background space-y-2">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Still et raskt spørsmål..."
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        {messages.length > 1 && (
          <Button 
            onClick={saveConversationAsNote}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            <Save className="h-3 w-3 mr-1.5" />
            Lagre i Mine Notater
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuickAIChat;
