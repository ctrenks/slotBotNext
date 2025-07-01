"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface SlotWinFormProps {
  onSuccess?: () => void;
}

export default function SlotWinForm({ onSuccess }: SlotWinFormProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    winAmount: "",
    slotGame: "",
    casino: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "File size must be under 5MB",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        setMessage({
          type: "error",
          text: "File must be an image",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("winAmount", formData.winAmount);
      form.append("slotGame", formData.slotGame);
      form.append("casino", formData.casino);

      const fileInput = document.getElementById(
        "screenshot"
      ) as HTMLInputElement;
      if (fileInput.files?.[0]) {
        form.append("screenshot", fileInput.files[0]);
      }

      const response = await fetch("/api/slot-wins", {
        method: "POST",
        body: form,
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Your slot win has been shared successfully! It's now visible to the community.",
        });
        setFormData({
          title: "",
          description: "",
          winAmount: "",
          slotGame: "",
          casino: "",
        });
        setPreviewUrl(null);
        if (fileInput) fileInput.value = "";
        onSuccess?.();
      } else {
        const errorText = await response.text();
        setMessage({
          type: "error",
          text: errorText || "Failed to submit slot win",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred while submitting your slot win",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Share Your Slot Win
        </h3>
        <p className="text-gray-600 mb-4">
          Please sign in to share your amazing slot wins with the community!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Share Your Slot Win
      </h3>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.type === "success"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Win Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 'Epic Jackpot on Starburst!'"
          />
        </div>

        <div>
          <label
            htmlFor="winAmount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Win Amount *
          </label>
          <input
            type="text"
            id="winAmount"
            name="winAmount"
            value={formData.winAmount}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., '$1,250' or '€850'"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="slotGame"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Slot Game
            </label>
            <input
              type="text"
              id="slotGame"
              name="slotGame"
              value={formData.slotGame}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 'Starburst'"
            />
          </div>

          <div>
            <label
              htmlFor="casino"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Casino
            </label>
            <input
              type="text"
              id="casino"
              name="casino"
              value={formData.casino}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 'LeoVegas'"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell us about your amazing win! What happened? How did it feel?"
          />
        </div>

        <div>
          <label
            htmlFor="screenshot"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Screenshot (Optional)
          </label>
          <input
            type="file"
            id="screenshot"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max file size: 5MB. Supported formats: JPG, PNG, GIF
          </p>
        </div>

        {previewUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <div className="relative w-full max-w-md">
              <Image
                src={previewUrl}
                alt="Screenshot preview"
                width={400}
                height={300}
                className="rounded-md border border-gray-200 object-cover"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !formData.title || !formData.winAmount}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting || !formData.title || !formData.winAmount
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Share My Win"}
        </button>
      </form>
    </div>
  );
}
