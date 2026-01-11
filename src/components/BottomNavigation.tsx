import { Home, BookOpen, Calendar, Clock, FileText, Brain } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: "Hjem",
      path: "/",
      isActive: location.pathname === "/"
    },
    {
      icon: BookOpen,
      label: "Øving",
      path: "/practice",
      isActive: location.pathname === "/practice"
    },
    {
      icon: Calendar,
      label: "Prøver",
      path: "/tests",
      isActive: location.pathname === "/tests"
    },
    {
      icon: Clock,
      label: "Studieplan",
      path: "/planner",
      isActive: location.pathname === "/planner"
    },
    {
      icon: FileText,
      label: "Notater",
      path: "/notes",
      isActive: location.pathname === "/notes"
    },
    {
      icon: Brain,
      label: "AI Kompis",
      path: "/ai-chat",
      isActive: location.pathname === "/ai-chat"
    }
  ];

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                item.isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${item.isActive ? "text-primary" : ""}`} />
              <span className={`text-xs font-medium truncate ${item.isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};

export default BottomNavigation;