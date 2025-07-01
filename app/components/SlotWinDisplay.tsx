"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface SlotWin {
  id: string;
  title: string;
  description: string | null;
  winAmount: string;
  slotGame: string | null;
  casino: string | null;
  imageUrl: string | null;
  featured: boolean;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

export default function SlotWinDisplay() {
  const [wins, setWins] = useState<SlotWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWins();
  }, []);

  const fetchWins = async () => {
    try {
      const response = await fetch("/api/slot-wins");
      if (response.ok) {
        const data = await response.json();
        setWins(data);
      } else {
        setError("Failed to load slot wins");
      }
    } catch (error) {
      setError("Failed to load slot wins");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading slot wins...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (wins.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          No slot wins have been shared yet. Be the first to share your win!
        </p>
      </div>
    );
  }

  // Separate featured and regular wins
  const featuredWins = wins.filter((win) => win.featured);
  const regularWins = wins.filter((win) => !win.featured);

  return (
    <div className="space-y-8">
      {/* Featured Wins */}
      {featuredWins.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-yellow-500 mr-2">⭐</span>
            Featured Wins
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredWins.map((win) => (
              <SlotWinCard key={win.id} win={win} featured={true} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Wins */}
      {regularWins.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Community Wins
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularWins.map((win) => (
              <SlotWinCard key={win.id} win={win} featured={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SlotWinCardProps {
  win: SlotWin;
  featured: boolean;
}

function SlotWinCard({ win, featured }: SlotWinCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className={`bg-white rounded-lg border overflow-hidden transition-transform hover:scale-105 ${
        featured
          ? "border-yellow-300 shadow-lg ring-2 ring-yellow-200"
          : "border-gray-200 shadow-sm"
      }`}
    >
      {/* Image */}
      {win.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={win.imageUrl}
            alt={win.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              ⭐ Featured
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <h4 className="font-bold text-lg text-gray-900 mb-2">{win.title}</h4>

        {/* Win Amount */}
        <div className="text-2xl font-bold text-blue-600 mb-2">
          {win.winAmount}
        </div>

        {/* Game and Casino */}
        <div className="flex flex-wrap gap-2 mb-3">
          {win.slotGame && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              🎰 {win.slotGame}
            </span>
          )}
          {win.casino && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              🏢 {win.casino}
            </span>
          )}
        </div>

        {/* Description */}
        {win.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {win.description}
          </p>
        )}

        {/* User and Date */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
              <Image
                src={win.user.image || "/img/defaultuser.png"}
                alt={win.user.name || "User"}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
            <span className="text-sm text-gray-700">
              {win.user.name || "Anonymous"}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatDate(win.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
