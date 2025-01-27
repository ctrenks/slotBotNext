"use client";

interface InfoButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function InfoButton({ onClick, isOpen }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
    >
      <svg
        className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round" 
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
      Info
    </button>
  );
}
