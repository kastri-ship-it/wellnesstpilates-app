# Mock Data Generation Feature

## Overview
The app now includes a developer tools feature that allows you to generate 50 mock users with realistic bookings to demonstrate how the admin panel, reservations, and user database management work.

## How to Access

1. **Login to Admin Panel**
   - Click the hidden admin button (donut shape in bottom-right corner)
   - Enter credentials: `admin` / `admin`

2. **Open Developer Tools**
   - In the admin panel header, click the ⚙️ (Settings) icon
   - This opens the Developer Tools modal

## Features

### Generate Mock Data
- Creates **100 mock users** with Albanian, Macedonian, and English names
- Generates **2-4 bookings per user** (total ~200-400 bookings)
- **Date Range**: January 23rd to February 28th, 2026 (weekdays only)
- Time slots between 08:00 - 18:00 (7 slots per day)
- Mixed package types:
  - 8 Sessions Package (3500 DEN)
  - 10 Sessions Package (4200 DEN) 
  - 12 Sessions Package (4800 DEN)
  - Single Session (600 DEN)
- Random activation codes generated for each user
- 70% confirmed bookings, 30% pending
- Realistic session remainders for each user
- Users registered between January 1-22, 2026
- Bookings created 1-3 days before the actual booking date
- **Coverage**: Ensures bookings on every weekday throughout the period

### Clear All Data
- Removes all users from the database
- Removes all bookings
- Removes all activation codes
- Includes confirmation prompt to prevent accidental deletion

## Mock Data Details

### User Information
- **Names**: Mix of Albanian (Arjeta, Luan), Macedonian (Marija, Stefan), and English (Emma, Oliver) names
- **Emails**: Format `firstname.lastname{number}@example.com`
- **Phone Numbers**: Realistic Macedonian format `070XXXXXX`
- **Activation Codes**: Random codes in format `WN-XXXX-XXXX`

### Booking Distribution
- **Dates**: January 23 - February 28, 2026 (weekdays only - ~26 days)
- **Times**: 7 slots per day (08:00, 09:00, 10:00, 11:00, 16:00, 17:00, 18:00)
- **Total Slots**: ~26 days × 7 time slots = 182 available time slots
- **Expected Bookings**: 200-400 bookings across all slots
- **Average per Slot**: ~1-2 bookings per slot (plenty of availability)
- **Capacity**: 4 people per time slot
- **Instructors**: Randomly assigned (Instructor 1, 2, or 3)
- **Creation Time**: Bookings created 1-3 days before the actual date

### Package Sessions
- **8 Sessions**: Users have 1-8 remaining sessions
- **10 Sessions**: Users have 1-10 remaining sessions  
- **12 Sessions**: Users have 1-12 remaining sessions
- **Single**: Users have 0-1 remaining sessions

## Testing Scenarios

After generating mock data, you can test:

1. **Calendar View** 
   - View bookings distributed across multiple dates
   - See different capacity levels per time slot
   - Filter by date and time

2. **User Management**
   - Browse 50 users in the database
   - Toggle between confirmed/pending users
   - View user details (package, sessions remaining)
   - Delete, block, or gift sessions to users

3. **Email System**
   - Send activation codes to mock users (Note: emails won't actually send to fake addresses)
   - View activation code format and structure

4. **Booking Flow**
   - See realistic booking data
   - Test capacity limits (4 per slot)
   - View booking status transitions

## Technical Details

- **Endpoint**: `POST /make-server-b87b0c07/dev/generate-mock-data`
- **Database**: Stores in Supabase KV store
- **Keys Used**: 
  - `user:{email}` - User profiles
  - `booking:{id}` - Individual bookings
  - `activation_code:{code}` - Activation codes
  - `user_bookings:{email}` - User's booking lists

## Notes

- Mock emails are fake (`@example.com`) so activation emails won't actually send
- Users are registered between January 1-22, 2026
- Bookings span January 23 - February 28, 2026 (weekdays only)
- All bookings are created 1-3 days before their scheduled date
- Activation codes follow the real format used in production (WN-XXXX-XXXX)
- Mock data includes all the same fields as real production data
- **Coverage**: With 100 users making 2-4 bookings each, every day will have multiple booked slots
- You can regenerate mock data multiple times (will create additional users)
- Use "Clear All Data" between regenerations for clean slate

## Recommended Testing Flow

1. Clear all existing data (if any)
2. Generate mock data (50 users created)
3. Explore admin panel calendar view
4. Switch to users tab and browse database
5. Test user management features (delete, block, gift)
6. Try booking flow to see capacity limits
7. Clear data when done testing
