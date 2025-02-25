"use server";

import { prisma } from "@/prisma";

/**
 * Sends a postback to the affiliate network for a conversion
 * @param clickId The clickId to send the postback for
 * @param action The action that was completed (e.g., "signup", "purchase")
 * @returns Success status and message
 */
export async function sendPostback(clickId: string, action: string = "signup") {
  try {
    if (!clickId) {
      return { success: false, message: "No clickId provided" };
    }

    // Find user with this clickId
    const user = await prisma.user.findFirst({
      where: { clickId },
    });

    if (!user) {
      return { success: false, message: "No user found with this clickId" };
    }

    // Get the postback URL from settings
    const postbackUrl = await getPostbackUrl();

    if (!postbackUrl) {
      return { success: false, message: "No postback URL configured" };
    }

    // Log the postback
    console.log(
      `Sending postback for clickId: ${clickId}, action: ${action}, user: ${user.email}`
    );

    // Replace placeholders in the postback URL
    const finalUrl = postbackUrl
      .replace("${SUBID}", clickId)
      .replace("${PAYOUT}", "10.00"); // Default payout amount

    // Make the actual HTTP request to the affiliate network
    try {
      const response = await fetch(finalUrl);
      const success = response.ok;

      if (success) {
        // Clear the clickId from the user record to prevent duplicate conversions
        await prisma.user.update({
          where: { id: user.id },
          data: { clickId: null },
        });

        return { success: true, message: "Postback sent successfully" };
      } else {
        return {
          success: false,
          message: `Failed to send postback: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error("Error sending postback request:", error);
      return {
        success: false,
        message: `Error sending postback request: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  } catch (error) {
    console.error("Error in sendPostback function:", error);
    return {
      success: false,
      message: `Error in sendPostback function: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Saves the postback URL to the database settings
 * @param url The postback URL to save
 * @returns Success status
 */
export async function savePostbackUrl(url: string): Promise<boolean> {
  try {
    // Create or update the setting
    await prisma.setting.upsert({
      where: { key: "postback_url" },
      update: { value: url },
      create: { key: "postback_url", value: url },
    });
    return true;
  } catch (error) {
    console.error("Error saving postback URL:", error);
    return false;
  }
}

/**
 * Gets the current postback URL from the database settings
 * @returns The postback URL or null if not set
 */
export async function getPostbackUrl(): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "postback_url" },
    });
    return setting?.value || null;
  } catch (error) {
    console.error("Error getting postback URL:", error);
    return null;
  }
}
