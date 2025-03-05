"use client";

import {
  getStoredClickId,
  getStoredOfferCode,
  getStoredReferrer,
  clearStoredClickId,
  clearStoredOfferCode,
  clearStoredReferrer,
} from "./urlParams";

/**
 * Gets all stored tracking data from localStorage
 * @returns An object containing all tracking data
 */
export function getTrackingData() {
  return {
    clickId: getStoredClickId(),
    offerCode: getStoredOfferCode(),
    referrer: getStoredReferrer(),
  };
}

/**
 * Clears all stored tracking data from localStorage
 */
export function clearTrackingData() {
  clearStoredClickId();
  clearStoredOfferCode();
  clearStoredReferrer();
}

/**
 * Adds tracking data to the auth credentials
 * @param credentials The auth credentials
 * @returns The auth credentials with tracking data
 */
export function addTrackingToCredentials(credentials: Record<string, unknown>) {
  const trackingData = getTrackingData();

  if (trackingData.clickId) {
    credentials.clickId = trackingData.clickId;
  }

  if (trackingData.offerCode) {
    credentials.offerCode = trackingData.offerCode;
  }

  return credentials;
}
