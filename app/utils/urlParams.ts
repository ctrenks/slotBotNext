"use client";

/**
 * Gets URL parameters from the current window location
 * @returns An object containing all URL parameters
 */
export function getUrlParams(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

/**
 * Stores the clickid in localStorage for later use during registration
 */
export function storeClickId(): void {
  if (typeof window === "undefined") return;

  const params = getUrlParams();
  if (params.clickid) {
    localStorage.setItem("clickid", params.clickid);
    console.log("Stored clickid:", params.clickid);
  }
}

/**
 * Retrieves the stored clickid from localStorage
 * @returns The stored clickid or null if not found
 */
export function getStoredClickId(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("clickid");
}

/**
 * Clears the stored clickid from localStorage
 */
export function clearStoredClickId(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("clickid");
}
