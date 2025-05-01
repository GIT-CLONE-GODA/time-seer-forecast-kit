
import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch 
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
