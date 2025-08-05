import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface UsernameModalProps {
  onUsernameSet: (username: string) => void;
}

export function UsernameModal({ onUsernameSet }: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const getActiveUsers = (): string[] => {
    if (typeof window === "undefined") return [];
    const users = localStorage.getItem("active-users");
    return users ? JSON.parse(users) : [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.trim().length < 2) {
      setError("Username must be at least 2 characters");
      return;
    }

    const activeUsers = getActiveUsers();
    if (activeUsers.includes(username.trim())) {
      setError("Username is already taken");
      return;
    }

    onUsernameSet(username.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-primary mb-4">Enter Your Name</h2>
        <p className="text-muted-foreground mb-6">
          Choose a unique username for this session
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="Your username"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Join Session
          </Button>
        </form>
      </Card>
    </div>
  );
}