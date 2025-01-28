import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Toggle } from "~/components/ui/toggle";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <Toggle
      pressed={isDark}
      onPressedChange={toggleDarkMode}
      aria-label="Toggle dark mode"
      className="fixed top-4 right-4"
    >
      {isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Toggle>
  );
}
