import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";

interface EditableCardProps {
  id: string;
  initialText: string;
  votes: number;
  backgroundColor: string;
  onTextChange: (text: string) => void;
  onDelete: () => void;
  onVote: (increment: boolean) => void;
  seconds: number;
  isTimerRunning: boolean;
  onTimerUpdate: (seconds: number, isRunning: boolean) => void;
  column: string;
  onDragStart?: (cardId: string, column: string) => void;
  cardNumber: number;
  userVotes: Record<string, number>;
  currentUsername: string;
}

export function EditableCard({
  id,
  initialText,
  votes,
  onTextChange,
  onDelete,
  onVote,
  backgroundColor,
  seconds: initialSeconds,
  isTimerRunning: initialIsRunning,
  onTimerUpdate,
  column,
  onDragStart,
  cardNumber,
  userVotes,
  currentUsername,
}: EditableCardProps) {
  const [isEditing, setIsEditing] = useState(!initialText);
  const [text, setText] = useState(initialText);
  const [isDragging, setIsDragging] = useState(false);

  const [isTimerRunning, setIsTimerRunning] = useState(initialIsRunning);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsTimerRunning(initialIsRunning);
  }, [initialSeconds, initialIsRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && seconds < 300) {
      interval = setInterval(() => {
        const newSeconds = seconds + 1;
        setSeconds(newSeconds);
        onTimerUpdate(newSeconds, isTimerRunning);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, seconds, onTimerUpdate]);

  const toggleTimer = () => {
    const newIsRunning = !isTimerRunning;
    setIsTimerRunning(newIsRunning);
    onTimerUpdate(seconds, newIsRunning);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    onTextChange(newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: id, sourceColumn: column }));
    e.dataTransfer.effectAllowed = 'move';
    // Hide the default drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(img, 0, 0);
    
    if (onDragStart) {
      onDragStart(id, column);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Calculate user's vote count and shadow effect
  const currentUserVoteCount = userVotes[currentUsername] || 0;
  const voteShadow = currentUserVoteCount > 0 
    ? 'shadow-[0_0_10px_2px_rgba(0,255,255,0.6)]' 
    : '';

  return (
    <Card
      className={`p-4 mb-4 hover:bg-card/80 transition-all group relative flex gap-3 ${
        isDragging ? 'transform rotate-2 opacity-70' : ''
      } ${
        isTimerRunning ? 'shadow-[0_0_20px_2px_rgba(34,197,94,0.8)]' : voteShadow
      }`}
      style={{ backgroundColor }}
      key={id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Left side - Vote buttons */}
      <div className="flex flex-col items-center justify-center gap-2">
        <button
          onClick={() => onVote(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-400 p-1 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#0A2A0A] to-[#0A2A2A]
            bg-clip-padding border-2 border-[#39FF14]/30 hover:border-[#39FF14]
            shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.5)]
            [&>svg]:text-[#39FF14] hover:[&>svg]:text-[#7FFF6E]"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium">{votes}</p>
        <button
          onClick={() => onVote(false)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-400 p-1 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#2A1000] to-[#2A0000]
            bg-clip-padding border-2 border-[#FF6B00]/30 hover:border-[#FF6B00]
            shadow-[0_0_15px_rgba(255,107,0,0.2)] hover:shadow-[0_0_20px_rgba(255,107,0,0.5)]
            [&>svg]:text-[#FF6B00] hover:[&>svg]:text-[#FFB366]"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>

      {/* Middle - Text content */}
      <div className="flex-1 flex flex-col justify-between">
        <div
          onClick={() => !isEditing && setIsEditing(true)}
          onKeyDown={(e) => {
            if (!isEditing && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setIsEditing(true);
            }
          }}
          role="button"
          tabIndex={0}
        >
          {isEditing ? (
            <input
              type="text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsEditing(false)}
              className="w-full bg-transparent border-none outline-none focus:ring-0 cursor-text"
            />
          ) : (
            <h3 className="text-lg font-semibold cursor-pointer">{text}</h3>
          )}
        </div>
        <button
          onClick={toggleTimer}
          className={`mt-2 text-center cursor-pointer select-none
            ${seconds >= 300 ? "text-red-500" : "text-green-500"}
            ${isTimerRunning ? "font-bold" : "opacity-70"}`}
        >
          {formatTime(seconds)}
        </button>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-400 p-1 rounded-lg transition-all duration-200
            bg-gradient-to-r from-[#2A0A1A] to-[#2A0A2A] bg-clip-padding border-2 border-[#FF1493]/30
            hover:border-[#FF1493] shadow-[0_0_15px_rgba(255,20,147,0.2)]
            hover:shadow-[0_0_20px_rgba(255,20,147,0.5)] [&>svg]:text-[#FF1493] hover:[&>svg]:text-[#FF69B4]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Card number in bottom right corner */}
      <div className="absolute bottom-2 right-2 text-sm font-mono text-muted-foreground opacity-60">
        {cardNumber}
      </div>
    </Card>
  );
}
