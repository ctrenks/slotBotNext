interface InfoBoxProps {
  children: React.ReactNode;
  className?: string;
}

export default function InfoBox({ children, className = "" }: InfoBoxProps) {
  return (
    <div className="border-x-4 border-x-blue-600 rounded-lg shadow-lg">
      <div
        className={`
        p-4
        rounded-lg
        border-2

        border-[#f9d90a]
        shadow-lg
        relative
        overflow-hidden
        ${className}
      `}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f9d90a]/5 to-[#dc7d11]/5 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
