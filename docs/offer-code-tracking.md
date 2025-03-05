# Offer Code Tracking System

This document explains how the offer code tracking system works in the SlotBot application.

## Overview

The system captures `offercode` parameters from URLs and associates them with users during registration. This allows for tracking different promotional offers and campaigns.

## How It Works

1. **Capturing OfferCode**: When a user visits the site with an `offercode` parameter in the URL (e.g., `/?offercode=BIGYEAR`), the system stores this value in localStorage.

2. **Registration**: During user registration/sign-in, the stored offercode is associated with the user's account in the database.

3. **Analytics**: The system tracks users with offer codes and provides statistics in the admin dashboard.

## Admin Dashboard

Administrators can view offer code statistics in the admin dashboard:

1. Navigate to `/admin/affiliate/stats`
2. View the number of users with offer codes
3. View the conversion rate for users with offer codes

## Implementation Details

### URL Parameter Capture

The `ClickIdCapture` component runs on every page load and captures the offercode from the URL:

```typescript
// app/components/ClickIdCapture.tsx
"use client";

import { useEffect } from "react";
import { storeClickId } from "../utils/urlParams";

export default function ClickIdCapture() {
  useEffect(() => {
    // Store clickid and offercode from URL if present
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

  // Also check for offercode parameter
  if (params.offercode) {
    localStorage.setItem("offercode", params.offercode);
    console.log("Stored offercode:", params.offercode);
  }
}

export function getStoredOfferCode(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("offercode");
}

export function clearStoredOfferCode(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("offercode");
}
```

### User Registration

During sign-in, the offercode is passed to the authentication system:

```typescript
// app/auth/signin/SignInButtons.tsx
const handleEmailSignIn = async (e: React.FormEvent) => {
  // ...
  const result = await signIn("resend", {
    email,
    redirect: false,
    clickId: clickId || undefined,
    offerCode: offerCode || undefined,
  });

  if (result?.ok) {
    // Clear the clickId and offerCode from localStorage after they've been used
    if (clickId) {
      clearStoredClickId();
    }
    if (offerCode) {
      clearStoredOfferCode();
    }
    // ...
  }
};
```

### Authentication System

The auth system stores the offercode with the user:

```typescript
// auth.ts
async signIn({ user, ...params }) {
  // Check if there's a clickId or offerCode in the params
  const clickId = (params as Record<string, unknown>).clickId as string | undefined;
  const offerCode = (params as Record<string, unknown>).offerCode as string | undefined;

  if ((clickId || offerCode) && user.email) {
    const updateData: Record<string, string> = {};

    if (clickId) {
      console.log(`Storing clickId ${clickId} for user ${user.email}`);
      updateData.clickId = clickId;
    }

    if (offerCode) {
      console.log(`Storing offerCode ${offerCode} for user ${user.email}`);
      updateData.offerCode = offerCode;
    }

    // Store the data with the user
    await prisma.user.update({
      where: { email: user.email },
      data: updateData,
    });
  }

  return true;
}
```

## Database Schema

The User model includes an `offerCode` field:

```prisma
model User {
  // other fields...
  clickId       String?          // Tracking ID for affiliate postbacks
  offerCode     String?          // Promotional offer code
}
```

## Usage Examples

### Creating Promotional Links

Create promotional links with offercode parameters:

```
https://yourdomain.com/?offercode=BIGYEAR
```

### Tracking Offer Codes

You can track the effectiveness of different promotional offers by analyzing the statistics in the admin dashboard.

### Combined Tracking

You can combine offer codes with affiliate tracking by including both parameters in the URL:

```
https://yourdomain.com/?clickid=AFFILIATE_ID_123&offercode=BIGYEAR
```

This allows you to track both the affiliate source and the specific promotional offer that brought in the user.
