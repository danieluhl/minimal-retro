import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, X } from "lucide-react";
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
  onMove: (direction: "left" | "right") => void;
  seconds: number;
  isTimerRunning: boolean;
  onTimerUpdate: (seconds: number, isRunning: boolean) => void;
}

export function EditableCard({
  id,
  initialText,
  votes,
  onTextChange,
  onDelete,
  onVote,
  onMove,
  backgroundColor,
  seconds: initialSeconds,
  isTimerRunning: initialIsRunning,
  onTimerUpdate,
}: EditableCardProps) {
  const [isEditing, setIsEditing] = useState(!initialText);
  const [text, setText] = useState(initialText);

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
    if (e.key === "Enter") {
      setIsEditing(false);
    }
  };

  return (
    <Card
      className="p-4 mb-4 hover:bg-card/80 transition-colors group relative flex gap-3"
      style={{ backgroundColor }}
      key={id}
    >
      {/* Left side - Vote buttons */}
      <div className="flex flex-col items-center justify-center gap-2">
        <button
          onClick={() => onVote(true)}
          className="p-1 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#0A2A0A] to-[#0A2A2A]
            bg-clip-padding border-2 border-[#39FF14]/30 hover:border-[#39FF14]
            shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.5)]
            [&>svg]:text-[#39FF14] hover:[&>svg]:text-[#7FFF6E]"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium">{votes}</p>
        <button
          onClick={() => onVote(false)}
          className="p-1 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#2A1000] to-[#2A0000]
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
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all duration-200
            bg-gradient-to-r from-[#2A0A1A] to-[#2A0A2A] bg-clip-padding border-2 border-[#FF1493]/30
            hover:border-[#FF1493] shadow-[0_0_15px_rgba(255,20,147,0.2)]
            hover:shadow-[0_0_20px_rgba(255,20,147,0.5)] [&>svg]:text-[#FF1493] hover:[&>svg]:text-[#FF69B4]"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={() => onMove("right")}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all duration-200
            bg-gradient-to-r from-[#0A2A2A] to-[#0A1A2A] bg-clip-padding border-2 border-[#00FFFF]/30
            hover:border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.2)]
            hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] [&>svg]:text-[#00FFFF] hover:[&>svg]:text-[#80FFFF]"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onMove("left")}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all duration-200
            bg-gradient-to-r from-[#2A0A2A] to-[#1A0A2A] bg-clip-padding border-2 border-[#FF00FF]/30
            hover:border-[#FF00FF] shadow-[0_0_15px_rgba(255,0,255,0.2)]
            hover:shadow-[0_0_20px_rgba(255,0,255,0.5)] [&>svg]:text-[#FF00FF] hover:[&>svg]:text-[#FF80FF]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
