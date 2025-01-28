"use client";

import React, { useState, useRef } from "react";
import { User } from "@prisma/client";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface ProfileFormProps {
  user: User;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user }) => {
  const { update: updateSession } = useSession();
  const [isEditing, setIsEditing] = useState(!user.name);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user.name || "",
    birthday: user.birthday?.toISOString().split("T")[0] || "",
    location: user.location || "",
    bio: user.bio || "",
    image: user.image || "/img/defaultuser.png",
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const blob = await response.json();
      setFormData((prev) => ({ ...prev, image: blob.url }));

      // Update session with new image
      await updateSession({
        image: blob.url,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Update session with new profile data
        await updateSession({
          name: formData.name,
          image: formData.image,
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden">
            <Image
              src={formData.image}
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-foreground dark:text-foreground-dark">
            <h2 className="text-xl font-semibold">Profile Information</h2>
            <p>
              <strong>Name:</strong> {formData.name}
            </p>
            <p>
              <strong>Birthday:</strong> {formData.birthday}
            </p>
            <p>
              <strong>Location:</strong> {formData.location}
            </p>
            <p>
              <strong>Bio:</strong> {formData.bio}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
        >
          Edit Profile
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <div className="relative w-20 h-20 rounded-full overflow-hidden">
            <Image
              src={formData.image}
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white p-1 rounded-full transition-colors"
            disabled={uploading}
          >
            {uploading ? (
              <span className="animate-spin">↻</span>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark"
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="mt-1 block w-full rounded-lg bg-white dark:bg-primary-dark text-foreground dark:text-white border border-gray-300 dark:border-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="birthday"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark"
            >
              Birthday
            </label>
            <input
              type="date"
              id="birthday"
              className="mt-1 block w-full rounded-lg bg-white dark:bg-primary-dark text-foreground dark:text-white border border-gray-300 dark:border-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
              value={formData.birthday}
              onChange={(e) =>
                setFormData({ ...formData, birthday: e.target.value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-foreground dark:text-foreground-dark"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              className="mt-1 block w-full rounded-lg bg-white dark:bg-primary-dark text-foreground dark:text-white border border-gray-300 dark:border-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-foreground dark:text-foreground-dark"
        >
          Bio
        </label>
        <textarea
          id="bio"
          rows={6}
          className="mt-1 block w-full rounded-lg bg-white dark:bg-primary-dark text-foreground dark:text-white border border-gray-300 dark:border-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="flex space-x-4 mt-6">
        <button
          type="submit"
          className="bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
        >
          Save Profile
        </button>
        {user.name && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-foreground dark:text-foreground-dark bg-white dark:bg-primary-dark hover:bg-gray-50 dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-accent-dark transition duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ProfileForm;
