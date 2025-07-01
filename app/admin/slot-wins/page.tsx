"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface SlotWin {
  id: string;
  title: string;
  description: string | null;
  winAmount: string;
  slotGame: string | null;
  casino: string | null;
  imageUrl: string | null;
  approved: boolean;
  featured: boolean;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function AdminSlotWinsPage() {
  const { data: session } = useSession();
  const [wins, setWins] = useState<SlotWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "featured" | "regular">("all");
  const [editingDisplayName, setEditingDisplayName] = useState<string | null>(
    null
  );
  const [tempDisplayName, setTempDisplayName] = useState<string>("");

  useEffect(() => {
    if (session?.user?.email === "chris@trenkas.com") {
      fetchWins();
    }
  }, [session]);

  const fetchWins = async () => {
    try {
      const response = await fetch("/api/admin/slot-wins");
      if (response.ok) {
        const data = await response.json();
        setWins(data);
      } else {
        setError("Failed to load slot wins");
      }
    } catch {
      setError("Failed to load slot wins");
    } finally {
      setLoading(false);
    }
  };

  const updateWin = async (
    id: string,
    updates: { approved?: boolean; featured?: boolean; displayName?: string }
  ) => {
    try {
      const response = await fetch("/api/admin/slot-wins", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        const updatedWin = await response.json();
        setWins((prev) =>
          prev.map((win) => (win.id === id ? updatedWin : win))
        );
      } else {
        alert("Failed to update slot win");
      }
    } catch {
      alert("Failed to update slot win");
    }
  };

  const startEditingDisplayName = (
    winId: string,
    currentDisplayName: string | null,
    userRealName: string | null
  ) => {
    setEditingDisplayName(winId);
    setTempDisplayName(currentDisplayName || userRealName || "");
  };

  const saveDisplayName = async (winId: string) => {
    await updateWin(winId, { displayName: tempDisplayName });
    setEditingDisplayName(null);
    setTempDisplayName("");
  };

  const cancelEditingDisplayName = () => {
    setEditingDisplayName(null);
    setTempDisplayName("");
  };

  const deleteWin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slot win?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/slot-wins?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWins((prev) => prev.filter((win) => win.id !== id));
      } else {
        alert("Failed to delete slot win");
      }
    } catch {
      alert("Failed to delete slot win");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (session?.user?.email !== "chris@trenkas.com") {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Admin only.</p>
      </div>
    );
  }

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

  const filteredWins = wins.filter((win) => {
    if (filter === "featured") return win.featured;
    if (filter === "regular") return !win.featured;
    return true;
  });

  const featuredCount = wins.filter((win) => win.featured).length;
  const regularCount = wins.filter((win) => !win.featured).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Slot Wins Management</h1>
        <div className="text-sm text-gray-300">
          Total: {wins.length} | Featured: {featuredCount} | Regular:{" "}
          {regularCount}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        {[
          { key: "all", label: "All", count: wins.length },
          { key: "featured", label: "Featured", count: featuredCount },
          { key: "regular", label: "Regular", count: regularCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as "all" | "featured" | "regular")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-700"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredWins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">
            No slot wins found for the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWins.map((win) => (
            <div
              key={win.id}
              className={`bg-gray-800 rounded-lg border p-6 ${
                win.featured ? "border-yellow-500" : "border-gray-600"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={win.user.image || "/img/defaultuser.png"}
                      alt={win.user.name || "User"}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1">
                    {editingDisplayName === win.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tempDisplayName}
                          onChange={(e) => setTempDisplayName(e.target.value)}
                          className="px-2 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded"
                          placeholder="Display name"
                          autoFocus
                        />
                        <button
                          onClick={() => saveDisplayName(win.id)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditingDisplayName}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">
                            {win.displayName || win.user.name || "Anonymous"}
                          </p>
                          <button
                            onClick={() =>
                              startEditingDisplayName(
                                win.id,
                                win.displayName,
                                win.user.name
                              )
                            }
                            className="text-gray-400 hover:text-white text-xs"
                            title="Edit display name"
                          >
                            ✏️
                          </button>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {win.displayName
                            ? `Real: ${win.user.name || "Anonymous"} | `
                            : ""}
                          {win.user.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {win.featured && (
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                      ⭐ Featured
                    </span>
                  )}
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    Live
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{win.title}</h3>
                  <div className="text-2xl font-bold text-blue-400 mt-1">
                    {win.winAmount}
                  </div>
                </div>

                {(win.slotGame || win.casino) && (
                  <div className="flex flex-wrap gap-2">
                    {win.slotGame && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        🎰 {win.slotGame}
                      </span>
                    )}
                    {win.casino && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        🏢 {win.casino}
                      </span>
                    )}
                  </div>
                )}

                {win.description && (
                  <p className="text-gray-300 text-sm">{win.description}</p>
                )}

                {win.imageUrl && (
                  <div className="relative h-48 w-full rounded-md overflow-hidden">
                    <Image
                      src={win.imageUrl}
                      alt={win.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Created: {formatDate(win.createdAt)}
                  {win.updatedAt !== win.createdAt && (
                    <span> | Updated: {formatDate(win.updatedAt)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => updateWin(win.id, { featured: !win.featured })}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    win.featured
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-yellow-500 hover:bg-yellow-600 text-black"
                  }`}
                >
                  {win.featured ? "Unfeature" : "Feature"}
                </button>

                <button
                  onClick={() => deleteWin(win.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
