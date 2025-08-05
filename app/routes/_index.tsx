import type { MetaFunction } from "@remix-run/node";
import { ArrowUpDown, LogOut, User, RotateCcw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { AddCardButton } from "~/components/AddCardButton";
import { EditableCard } from "~/components/EditableCard";
import { UsernameModal } from "~/components/UsernameModal";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import type { CardItem, CardColumns } from "~/lib/broadcast-types";
import { useBroadcast } from "~/lib/useBroadcast";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

// Remove the outer addCard function and move it inside the component
export default function Index() {
  const [username, setUsername] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("current-username");
  });
  const [showUsernameModal, setShowUsernameModal] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("current-username");
  });
  const [cards, setCards] = useState<CardColumns>(() => {
    if (typeof window === "undefined")
      return { discuss: [], done: [], action: [] };
    const saved = localStorage.getItem("retro-cards");
    return saved ? JSON.parse(saved) : { discuss: [], done: [], action: [] };
  });
  const [activeUsers, setActiveUsers] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("active-users");
    return saved ? JSON.parse(saved) : [];
  });
  const [draggedCard, setDraggedCard] = useState<{
    cardId: string;
    column: string;
  } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [nextCardNumber, setNextCardNumber] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const saved = localStorage.getItem("next-card-number");
    return saved ? parseInt(saved) : 1;
  });
  
  // Countdown timer state
  const [countdownSeconds, setCountdownSeconds] = useState<number>(300); // 5 minutes
  const [isCountdownRunning, setIsCountdownRunning] = useState<boolean>(false);

  const handleStateUpdate = useCallback(
    (newCards: CardColumns, newActiveUsers: string[]) => {
      setCards(newCards);
      setActiveUsers(newActiveUsers);
    },
    [],
  );

  const { broadcast, updateInternalState } = useBroadcast(
    username,
    handleStateUpdate,
  );

  useEffect(() => {
    updateInternalState(cards, activeUsers);
  }, [cards, activeUsers, updateInternalState]);

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("current-username", newUsername);

    const updatedActiveUsers = [...activeUsers];
    if (!updatedActiveUsers.includes(newUsername)) {
      updatedActiveUsers.push(newUsername);
      setActiveUsers(updatedActiveUsers);
      localStorage.setItem("active-users", JSON.stringify(updatedActiveUsers));

      broadcast("USER_JOINED", { username: newUsername });
    }

    setShowUsernameModal(false);
  };

  const handleLogout = () => {
    if (username) {
      const updatedUsers = activeUsers.filter(
        (user: string) => user !== username,
      );
      setActiveUsers(updatedUsers);
      localStorage.setItem("active-users", JSON.stringify(updatedUsers));
      localStorage.removeItem("current-username");

      broadcast("USER_LEFT", { username });

      setUsername(null);
      setShowUsernameModal(true);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (username) {
        const updatedUsers = activeUsers.filter(
          (user: string) => user !== username,
        );
        localStorage.setItem("active-users", JSON.stringify(updatedUsers));

        // Broadcast user leaving
        broadcast("USER_LEFT", { username });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [username, activeUsers, broadcast]);

  const addCard = (column: keyof CardColumns) => {
    // Generate random hue (0-360), consistent saturation (50%) and lightness (30%)
    const hue = Math.floor(Math.random() * 360);
    const randomColor = `hsl(${hue}, 50%, 30%, 0.2)`;
    const newCard: CardItem = {
      id: crypto.randomUUID(),
      text: "",
      votes: 0,
      backgroundColor: randomColor,
      seconds: 0,
      isTimerRunning: false,
      lastModified: Date.now(),
      cardNumber: nextCardNumber,
      userVotes: {},
    };

    // Update next card number
    const newNextCardNumber = nextCardNumber + 1;
    setNextCardNumber(newNextCardNumber);
    localStorage.setItem("next-card-number", newNextCardNumber.toString());

    setCards((prev) => ({
      ...prev,
      [column]: [...prev[column], newCard],
    }));

    broadcast("CARD_ADDED", { column, card: newCard });
  };

  const updateTimer = (
    column: keyof CardColumns,
    id: string,
    seconds: number,
    isRunning: boolean,
  ) => {
    setCards((prev) => ({
      ...prev,
      [column]: prev[column].map((card) =>
        card.id === id
          ? {
              ...card,
              seconds,
              isTimerRunning: isRunning,
              lastModified: Date.now(),
            }
          : card,
      ),
    }));

    broadcast("TIMER_UPDATED", {
      column,
      cardId: id,
      seconds,
      isTimerRunning: isRunning,
    });
  };

  const updateVotes = (
    column: keyof CardColumns,
    id: string,
    increment: boolean,
  ) => {
    if (!username) return;
    
    setCards((prev) => {
      const card = prev[column].find((c) => c.id === id);
      if (!card) return prev;
      
      const currentUserVotes = card.userVotes[username] || 0;
      
      // Check vote limits
      if (increment && currentUserVotes >= 3) return prev;
      if (!increment && currentUserVotes <= 0) return prev;
      
      const newUserVotes = increment ? currentUserVotes + 1 : currentUserVotes - 1;
      const updatedUserVotes = { ...card.userVotes, [username]: newUserVotes };
      
      // Clean up zero votes
      if (newUserVotes === 0) {
        delete updatedUserVotes[username];
      }
      
      // Calculate total votes
      const totalVotes = Object.values(updatedUserVotes).reduce((sum, votes) => sum + votes, 0);
      
      const updatedCard = {
        ...card,
        votes: totalVotes,
        userVotes: updatedUserVotes,
        lastModified: Date.now(),
      };
      
      broadcast("CARD_VOTED", { column, cardId: id, votes: totalVotes, userVotes: updatedUserVotes });
      
      return {
        ...prev,
        [column]: prev[column].map((c) => c.id === id ? updatedCard : c),
      };
    });
  };

  const updateCardText = (
    column: keyof CardColumns,
    id: string,
    text: string,
  ) => {
    setCards((prev) => ({
      ...prev,
      [column]: prev[column].map((card) =>
        card.id === id ? { ...card, text, lastModified: Date.now() } : card,
      ),
    }));

    broadcast("CARD_UPDATED", { column, cardId: id, updates: { text } });
  };

  const deleteCard = (column: keyof CardColumns, id: string) => {
    setCards((prev) => ({
      ...prev,
      [column]: prev[column].filter((card) => card.id !== id),
    }));

    broadcast("CARD_DELETED", { column, cardId: id });
  };

  const moveCardToColumn = (
    cardId: string,
    sourceColumn: keyof CardColumns,
    targetColumn: keyof CardColumns,
    index?: number,
  ) => {
    setCards((prev) => {
      const card = prev[sourceColumn].find((c) => c.id === cardId);
      if (!card) return prev;

      const updatedCard = { ...card, lastModified: Date.now() };

      broadcast("CARD_MOVED", {
        fromColumn: sourceColumn,
        toColumn: targetColumn,
        cardId: cardId,
        card: updatedCard,
      });

      const newTargetCards = [...prev[targetColumn]];
      if (index !== undefined) {
        newTargetCards.splice(index, 0, updatedCard);
      } else {
        newTargetCards.unshift(updatedCard);
      }

      return {
        ...prev,
        [sourceColumn]: prev[sourceColumn].filter((c) => c.id !== cardId),
        [targetColumn]: newTargetCards,
      };
    });
  };

  const handleDragStart = (cardId: string, column: string) => {
    setDraggedCard({ cardId, column });
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(column);

    // Calculate drop index based on mouse position
    const container = e.currentTarget as HTMLElement;
    const cards = container.querySelectorAll("[data-card-id]");
    const mouseY = e.clientY;

    let index = 0;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const rect = card.getBoundingClientRect();
      if (mouseY > rect.top + rect.height / 2) {
        index = i + 1;
      } else {
        break;
      }
    }

    setDropIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
      setDropIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumn: keyof CardColumns) => {
    e.preventDefault();

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { cardId, sourceColumn } = data;

      if (sourceColumn !== targetColumn) {
        moveCardToColumn(cardId, sourceColumn, targetColumn, dropIndex || 0);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }

    setDraggedCard(null);
    setDragOverColumn(null);
    setDropIndex(null);
  };

  const renderDropPlaceholder = (column: string, index: number) => {
    if (
      dragOverColumn === column &&
      dropIndex === index &&
      draggedCard?.column !== column
    ) {
      return (
        <div className="h-24 mb-4 bg-blue-500/20 rounded-lg border-2 border-dashed border-pink-500" />
      );
    }
    return null;
  };
  
  // Countdown timer functions
  const formatCountdownTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const toggleCountdown = () => {
    setIsCountdownRunning(!isCountdownRunning);
  };
  
  const resetCountdown = () => {
    setCountdownSeconds(300);
    setIsCountdownRunning(false);
  };
  
  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCountdownRunning && countdownSeconds > 0) {
      interval = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev <= 1) {
            setIsCountdownRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCountdownRunning, countdownSeconds]);
  const sortDiscussCards = () => {
    const sortedCards = [...cards.discuss].sort(
      (a, b) => (b.votes || 0) - (a.votes || 0),
    );

    setCards((prev) => ({
      ...prev,
      discuss: sortedCards,
    }));

    broadcast("CARDS_SORTED", { column: "discuss", cards: sortedCards });
  };
  // Update the JSX to fix column layout and add move functionality
  return (
    <div className="min-h-screen bg-background p-8 font-['Space_Grotesk']">
      {showUsernameModal && <UsernameModal onUsernameSet={handleUsernameSet} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Retro Board</h1>
        
        {/* Countdown Timer */}
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center gap-2 px-4 py-2 bg-card rounded-lg border cursor-pointer hover:bg-card/80 transition-colors ${
              isCountdownRunning ? 'shadow-[0_0_20px_2px_rgba(255,255,0,0.8)]' : ''
            }`}
            onClick={toggleCountdown}
          >
            <span className={`text-2xl font-mono font-bold ${
              countdownSeconds <= 60 ? 'text-red-500' : 'text-primary'
            }`}>
              {formatCountdownTime(countdownSeconds)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetCountdown}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {username && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{username}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Column 1 */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary tracking-tight">
              To Discuss
            </h2>
            <button
              onClick={sortDiscussCards}
              className="p-2 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#2A0A2A] to-[#1A0A2A]
              bg-clip-padding border-2 border-[#FF00FF]/30 hover:border-[#FF00FF]
              shadow-[0_0_15px_rgba(255,0,255,0.2)] hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]
              [&>svg]:text-[#FF00FF] hover:[&>svg]:text-[#FF80FF]"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>
          <Card
            className="flex-1 p-6 bg-card hover:bg-card/80 transition-colors overflow-y-auto"
            onDragOver={(e) => handleDragOver(e, "discuss")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "discuss")}
          >
            {renderDropPlaceholder("discuss", 0)}
            {cards.discuss.map((card, index) => (
              <div key={card.id}>
                <div data-card-id={card.id}>
                  <EditableCard
                    id={card.id}
                    initialText={card.text}
                    votes={card.votes || 0}
                    userVotes={card.userVotes || {}}
                    currentUsername={username || ""}
                    backgroundColor={card.backgroundColor}
                    onTextChange={(text) =>
                      updateCardText("discuss", card.id, text)
                    }
                    onDelete={() => deleteCard("discuss", card.id)}
                    onVote={(increment) =>
                      updateVotes("discuss", card.id, increment)
                    }
                    seconds={card.seconds}
                    isTimerRunning={card.isTimerRunning}
                    onTimerUpdate={(seconds, isRunning) =>
                      updateTimer("discuss", card.id, seconds, isRunning)
                    }
                    column="discuss"
                    onDragStart={handleDragStart}
                    cardNumber={card.cardNumber}
                  />
                </div>
                {renderDropPlaceholder("discuss", index + 1)}
              </div>
            ))}
            <AddCardButton onClick={() => addCard("discuss")} />
          </Card>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary tracking-tight">
              Done
            </h2>
          </div>
          <Card
            className="flex-1 p-6 bg-card hover:bg-card/80 transition-colors"
            onDragOver={(e) => handleDragOver(e, "done")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "done")}
          >
            {renderDropPlaceholder("done", 0)}
            {cards.done.map((card, index) => (
              <div key={card.id}>
                <div data-card-id={card.id}>
                  <EditableCard
                    id={card.id}
                    initialText={card.text}
                    votes={card.votes || 0}
                    userVotes={card.userVotes || {}}
                    currentUsername={username || ""}
                    backgroundColor={card.backgroundColor}
                    onTextChange={(text) =>
                      updateCardText("done", card.id, text)
                    }
                    onDelete={() => deleteCard("done", card.id)}
                    onVote={(increment) =>
                      updateVotes("done", card.id, increment)
                    }
                    seconds={card.seconds}
                    isTimerRunning={card.isTimerRunning}
                    onTimerUpdate={(seconds, isRunning) =>
                      updateTimer("done", card.id, seconds, isRunning)
                    }
                    column="done"
                    onDragStart={handleDragStart}
                    cardNumber={card.cardNumber}
                  />
                </div>
                {renderDropPlaceholder("done", index + 1)}
              </div>
            ))}
          </Card>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary tracking-tight">
              Action Items
            </h2>
          </div>
          <Card
            className="flex-1 p-6 bg-card hover:bg-card/80 transition-colors overflow-y-auto"
            onDragOver={(e) => handleDragOver(e, "action")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "action")}
          >
            {renderDropPlaceholder("action", 0)}
            {cards.action.map((card, index) => (
              <div key={card.id}>
                <div data-card-id={card.id}>
                  <EditableCard
                    id={card.id}
                    initialText={card.text}
                    votes={card.votes || 0}
                    userVotes={card.userVotes || {}}
                    currentUsername={username || ""}
                    onTextChange={(text) =>
                      updateCardText("action", card.id, text)
                    }
                    onDelete={() => deleteCard("action", card.id)}
                    onVote={(increment) =>
                      updateVotes("action", card.id, increment)
                    }
                    backgroundColor={card.backgroundColor}
                    seconds={card.seconds}
                    isTimerRunning={card.isTimerRunning}
                    onTimerUpdate={(seconds, isRunning) =>
                      updateTimer("action", card.id, seconds, isRunning)
                    }
                    column="action"
                    onDragStart={handleDragStart}
                    cardNumber={card.cardNumber}
                  />
                </div>
                {renderDropPlaceholder("action", index + 1)}
              </div>
            ))}
            <AddCardButton onClick={() => addCard("action")} />
          </Card>
        </div>
      </div>
    </div>
  );
}
