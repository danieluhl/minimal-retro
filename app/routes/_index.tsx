import type { MetaFunction } from "@remix-run/node";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { AddCardButton } from "~/components/AddCardButton";
import { EditableCard } from "~/components/EditableCard";
import { Card } from "~/components/ui/card";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

interface CardItem {
  id: string;
  text: string;
  votes: number;
  backgroundColor: string;
  seconds: number; // Add this
  isTimerRunning: boolean; // Add this
}

type CardColumns = {
  discuss: CardItem[];
  done: CardItem[];
  action: CardItem[];
};

// Remove the outer addCard function and move it inside the component
export default function Index() {
  const [cards, setCards] = useState<CardColumns>(() => {
    if (typeof window === "undefined")
      return { discuss: [], done: [], action: [] };
    const saved = localStorage.getItem("retro-cards");
    return saved ? JSON.parse(saved) : { discuss: [], done: [], action: [] };
  });

  useEffect(() => {
    localStorage.setItem("retro-cards", JSON.stringify(cards));
  }, [cards]);

  const addCard = (column: keyof CardColumns) => {
    const colors = [
      "rgba(25, 0, 50, 0.2)", // dark purple
      "rgba(0, 25, 50, 0.2)", // dark blue
      "rgba(0, 50, 25, 0.2)", // dark green
      "rgba(50, 25, 0, 0.2)", // dark orange
      "rgba(50, 0, 25, 0.2)", // dark red
      "rgba(25, 50, 0, 0.2)", // dark olive
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCard = {
      id: crypto.randomUUID(),
      text: "",
      votes: 0,
      backgroundColor: randomColor,
      seconds: 0,
      isTimerRunning: false,
    };
    setCards((prev) => ({
      ...prev,
      [column]: [newCard, ...prev[column]],
    }));
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
        card.id === id ? { ...card, seconds, isTimerRunning: isRunning } : card,
      ),
    }));
  };

  const updateVotes = (
    column: keyof CardColumns,
    id: string,
    increment: boolean,
  ) => {
    setCards((prev) => ({
      ...prev,
      [column]: prev[column].map((card) =>
        card.id === id
          ? {
              ...card,
              votes: Math.max(0, (card.votes || 0) + (increment ? 1 : -1)),
            }
          : card,
      ),
    }));
  };

  const updateCardText = (
    column: keyof CardColumns,
    id: string,
    text: string,
  ) => {
    setCards((prev) => ({
      ...prev,
      [column]: prev[column].map((card) =>
        card.id === id ? { ...card, text } : card,
      ),
    }));
  };

  const deleteCard = (column: keyof CardColumns, id: string) => {
    setCards((prev) => ({
      ...prev,
      [column]: prev[column].filter((card) => card.id !== id),
    }));
  };

  const moveCard = (
    currentColumn: keyof CardColumns,
    id: string,
    direction: "left" | "right",
  ) => {
    const columns: (keyof CardColumns)[] = ["discuss", "done", "action"];
    const currentIndex = columns.indexOf(currentColumn);
    const nextIndex =
      direction === "right"
        ? (currentIndex + 1) % columns.length
        : (currentIndex - 1 + columns.length) % columns.length;
    const nextColumn = columns[nextIndex];

    setCards((prev) => {
      const card = prev[currentColumn].find((c) => c.id === id);
      if (!card) return prev;

      return {
        ...prev,
        [currentColumn]: prev[currentColumn].filter((c) => c.id !== id),
        [nextColumn]: [card, ...prev[nextColumn]],
      };
    });
  };
  const sortDiscussCards = () => {
    setCards((prev) => ({
      ...prev,
      discuss: [...prev.discuss].sort(
        (a, b) => (b.votes || 0) - (a.votes || 0),
      ),
    }));
  };
  // Update the JSX to fix column layout and add move functionality
  return (
    <div className="min-h-screen bg-background p-8 font-['Space_Grotesk']">
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-4rem)]">
        {/* Column 1 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary tracking-tight">
              To Discuss
            </h2>
            <div className="flex gap-4">
              <button
                onClick={sortDiscussCards}
                className="p-2 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#2A0A2A] to-[#1A0A2A]
                bg-clip-padding border-2 border-[#FF00FF]/30 hover:border-[#FF00FF]
                shadow-[0_0_15px_rgba(255,0,255,0.2)] hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]
                [&>svg]:text-[#FF00FF] hover:[&>svg]:text-[#FF80FF]"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <AddCardButton onClick={() => addCard("discuss")} />
              </div>
            </div>
          </div>
          <Card className="flex-1 p-6 bg-card hover:bg-card/80 transition-colors overflow-y-auto">
            {cards.discuss.map((card) => (
              <EditableCard
                key={card.id}
                id={card.id}
                initialText={card.text}
                votes={card.votes || 0}
                backgroundColor={card.backgroundColor}
                onTextChange={(text) =>
                  updateCardText("discuss", card.id, text)
                }
                onDelete={() => deleteCard("discuss", card.id)}
                onVote={(increment) =>
                  updateVotes("discuss", card.id, increment)
                }
                onMove={(direction) => moveCard("discuss", card.id, direction)}
                seconds={card.seconds}
                isTimerRunning={card.isTimerRunning}
                onTimerUpdate={(seconds, isRunning) =>
                  updateTimer("discuss", card.id, seconds, isRunning)
                }
              />
            ))}
          </Card>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary tracking-tight">
              Done
            </h2>
            <AddCardButton onClick={() => addCard("done")} />
          </div>
          <Card className="flex-1 p-6 bg-card hover:bg-card/80 transition-colors overflow-y-auto">
            {cards.done.map((card) => (
              <EditableCard
                key={card.id}
                id={card.id}
                initialText={card.text}
                votes={card.votes || 0}
                backgroundColor={card.backgroundColor}
                onTextChange={(text) => updateCardText("done", card.id, text)}
                onDelete={() => deleteCard("done", card.id)}
                onVote={(increment) => updateVotes("done", card.id, increment)}
                onMove={(direction) => moveCard("done", card.id, direction)}
                seconds={card.seconds}
                isTimerRunning={card.isTimerRunning}
                onTimerUpdate={(seconds, isRunning) =>
                  updateTimer("discuss", card.id, seconds, isRunning)
                }
              />
            ))}
          </Card>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary tracking-tight">
              Action Items
            </h2>
            <AddCardButton onClick={() => addCard("action")} />
          </div>
          <Card className="flex-1 p-6 bg-card hover:bg-card/80 transition-colors overflow-y-auto">
            {cards.action.map((card) => (
              <EditableCard
                key={card.id}
                id={card.id}
                initialText={card.text}
                votes={card.votes || 0}
                onTextChange={(text) => updateCardText("action", card.id, text)}
                onDelete={() => deleteCard("action", card.id)}
                onVote={(increment) =>
                  updateVotes("action", card.id, increment)
                }
                backgroundColor={card.backgroundColor}
                onMove={(direction) => moveCard("action", card.id, direction)}
                seconds={card.seconds}
                isTimerRunning={card.isTimerRunning}
                onTimerUpdate={(seconds, isRunning) =>
                  updateTimer("discuss", card.id, seconds, isRunning)
                }
              />
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
