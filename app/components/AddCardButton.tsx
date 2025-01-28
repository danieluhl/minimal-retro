import { Plus } from "lucide-react";

export function AddCardButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#2A2A0A] to-[#2A2A00]
        bg-clip-padding border-2 border-[#FFFF00]/30 hover:border-[#FFFF00]
        shadow-[0_0_15px_rgba(255,255,0,0.2)] hover:shadow-[0_0_20px_rgba(255,255,0,0.5)]
        [&>svg]:text-[#FFFF00] hover:[&>svg]:text-[#FFFF80]"
    >
      <Plus className="h-4 w-4" />
    </button>
  );
}