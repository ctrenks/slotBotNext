# Affiliate Tracking System

This document explains how the affiliate tracking system works in the SlotBot application.

## Overview

The system captures `clickid` parameters from URLs and associates them with users during registration. This allows for tracking conversions and sending postbacks to affiliate networks.

## How It Works

1. **Capturing ClickID**: When a user visits the site with a `clickid` parameter in the URL (e.g., `/?clickid=abc123`), the system stores this value in localStorage.

2. **Registration**: During user registration/sign-in, the stored clickid is associated with the user's account in the database.

3. **Postbacks**: After a successful conversion (e.g., registration, payment), the system can send a postback to the affiliate network using the stored clickid.

## Admin Configuration

Administrators can configure the postback URL through the admin interface:

1. Navigate to `/admin/affiliates`
2. Enter the postback URL with placeholders:
   - Use `${SUBID}` as a placeholder for the clickid
   - Use `${PAYOUT}` as a placeholder for the conversion amount

Example postback URL:

```
http://ad.propellerads.com/conversion.php?aid=3781363&pid=&tid=141360&visitor_id=${SUBID}&payout=${PAYOUT}
```

## Implementation Details

### URL Parameter Capture

The `ClickIdCapture` component runs on every page load and captures the clickid from the URL:

```typescript
// app/components/ClickIdCapture.tsx
"use client";

import { useEffect } from "react";
import { storeClickId } from "../utils/urlParams";

export default function ClickIdCapture() {
  useEffect(() => {
    // Store clickid from URL if present
    storeClickId();
  }, []);

  // This component doesn't render anything
  return null;
}
```

### URL Parameter Utilities

The `urlParams.ts` utility file provides functions for working with URL parameters:

```typescript
// app/utils/urlParams.ts
"use client";

export function getUrlParams(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

export function storeClickId(): void {
  if (typeof window === "undefined") return;

  const params = getUrlParams();
  if (params.clickid) {
    localStorage.setItem("clickid", params.clickid);
    console.log("Stored clickid:", params.clickid);
  }
}

export function getStoredClickId(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("clickid");
}

export function clearStoredClickId(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("clickid");
}
```

### User Registration

During sign-in, the clickid is passed to the authentication system:

```typescript
// app/auth/signin/SignInButtons.tsx
const handleEmailSignIn = async (e: React.FormEvent) => {
  // ...
  const result = await signIn("resend", {
    email,
    redirect: false,
    clickId: clickId || undefined,
  });

  if (result?.ok) {
    // Clear the clickId from localStorage after it's been used
    if (clickId) {
      clearStoredClickId();
    }
    // ...
  }
};
```

### Authentication System

The auth system stores the clickid with the user:

```typescript
// auth.ts
async signIn({ user, ...params }) {
  // Check if there's a clickId in the params
  const clickId = (params as Record<string, unknown>).clickId as string | undefined;

  if (clickId && user.email) {
    console.log(`Storing clickId ${clickId} for user ${user.email}`);

    // Store the clickId with the user
    await prisma.user.update({
      where: { email: user.email },
      data: { clickId },
    });
  }

  return true;
}
```

### Postback API

The system includes an API endpoint for handling postbacks:

```typescript
// app/api/postback/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clickId = searchParams.get("clickid");
    const payout = searchParams.get("payout") || "10.00";

    // Find user with this clickId
    const user = await prisma.user.findFirst({
      where: { clickId },
    });

    // Get the configured postback URL
    const postbackUrl = await getPostbackUrl();

    // Replace placeholders in the postback URL
    const finalUrl = postbackUrl
      .replace(/\${SUBID}/g, clickId)
      .replace(/\${PAYOUT}/g, payout);

    // Make the actual HTTP request to the affiliate network
    const response = await fetch(finalUrl);

    // Process response and clear clickId to prevent duplicate conversions
    // ...
  } catch (error) {
    // Handle errors...
  }
}
```

## Usage Examples

### Tracking Affiliate Links

Create affiliate links with clickid parameters:

```
https://yourdomain.com/?clickid=AFFILIATE_ID_123
```

### Sending Postbacks

To send a postback for a conversion:

```typescript
import { sendPostback } from "@/app/utils/affiliates";

// After a successful conversion
await sendPostback(user.clickId, "signup");
```

### Checking Postbacks

You can manually trigger a postback by visiting:

```
https://yourdomain.com/api/postback?clickid=AFFILIATE_ID_123
```

### PropellerAds Integration

For PropellerAds, use the following postback URL format:

```
http://ad.propellerads.com/conversion.php?aid=3781363&pid=&tid=141360&visitor_id=${SUBID}&payout=${PAYOUT}
```

Where:

- `aid`: Your PropellerAds advertiser ID
- `tid`: Your PropellerAds tracking ID
- `visitor_id`: The clickid parameter (replaced with `${SUBID}`)
- `payout`: The conversion amount (replaced with `${PAYOUT}`)

## Database Schema

The User model includes a `clickId` field:

```prisma
model User {
  // other fields...
  clickId       String?          // Tracking ID for affiliate postbacks
}
```

The Setting model stores application settings, including the postback URL:

```prisma
model Setting {
  key   String @id
  value String
}
```
