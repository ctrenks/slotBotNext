# Affiliate Tracking System for SlotBot

This system allows you to track affiliate conversions by capturing `clickid` parameters from URLs and associating them with users during registration.

## Features

- Capture `clickid` parameters from URLs
- Store clickids with user accounts
- Send postbacks to affiliate networks
- Admin interface for configuring postback URLs
- Support for PropellerAds and other affiliate networks

## Setup Instructions

1. **Database Setup**:

   - The system requires a `Setting` table in the database
   - Run the script to create it: `node scripts/create-settings-table.cjs`

2. **Admin Configuration**:

   - Navigate to `/admin/affiliates` in your application
   - Configure the postback URL with placeholders:
     - Use `${SUBID}` for the clickid
     - Use `${PAYOUT}` for the conversion amount

3. **PropellerAds Integration**:
   - Use the following postback URL format:
   ```
   http://ad.propellerads.com/conversion.php?aid=3781363&pid=&tid=141360&visitor_id=${SUBID}&payout=${PAYOUT}
   ```

## How It Works

1. When a user visits your site with a `clickid` parameter (e.g., `/?clickid=abc123`), the system stores this value in localStorage.

2. During registration/sign-in, the stored clickid is associated with the user's account in the database.

3. After a successful conversion, the system sends a postback to the affiliate network using the stored clickid.

## Testing

1. Create a test affiliate link with a clickid:

   ```
   https://yourdomain.com/?clickid=TEST123
   ```

2. Register or sign in with a user account

3. Verify the clickid was stored with the user in the database

4. Trigger a postback manually:

   ```
   https://yourdomain.com/api/postback?clickid=TEST123
   ```

5. Check the network logs to confirm the postback was sent to the affiliate network

## Documentation

For more detailed documentation, see [docs/affiliate-tracking.md](docs/affiliate-tracking.md).
