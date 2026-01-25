# Mock Data Summary

## Date Range: January 23 - February 28, 2026

### Calendar Overview

**Total Weekdays**: ~26 days (excluding weekends)

**January 2026 (6 days):**
- Thu 23
- Fri 24
- Mon 27
- Tue 28
- Wed 29
- Thu 30
- Fri 31

**February 2026 (20 days):**
- Mon 2, Tue 3, Wed 4, Thu 5, Fri 6
- Mon 9, Tue 10, Wed 11, Thu 12, Fri 13
- Mon 16, Tue 17, Wed 18, Thu 19, Fri 20
- Mon 23, Tue 24, Wed 25, Thu 26, Fri 27

### Booking Distribution

**Time Slots (7 per day):**
- 08:00 - Morning
- 09:00 - Morning
- 10:00 - Morning
- 11:00 - Late Morning
- 16:00 - Afternoon
- 17:00 - Evening
- 18:00 - Evening

**Total Available Slots**: 26 days × 7 time slots = 182 slots
**Capacity per Slot**: 4 people
**Total Possible Bookings**: 728 bookings (if every slot is full)

**Expected Mock Bookings**: ~200-400 bookings (100 users × 2-4 bookings each)
**Average Occupancy**: ~25-50% of available slots (plenty of availability)

### User Timeline

**User Registration**: January 1-22, 2026
- All 50 mock users registered before booking period starts
- Random registration dates spread across 22 days

**Booking Creation**: 1-3 days before appointment
- Example: For appointment on Jan 27, booking created on Jan 24-26

**Appointment Dates**: January 23 - February 10, 2026

### Example User Journey

**User: Marija Stojanovski**
- Registered: January 15, 2026
- Package: 10 Sessions (4200 DEN)
- Sessions Remaining: 6
- Activation Code: WN-RTYK-9HF3

**Bookings:**
1. January 24, 2026 @ 09:00 (Instructor 1) - Confirmed
   - Booked on: January 22, 2026
   
2. January 29, 2026 @ 17:00 (Instructor 2) - Confirmed
   - Booked on: January 27, 2026
   
3. February 5, 2026 @ 10:00 (Instructor 3) - Confirmed
   - Booked on: February 3, 2026

4. February 18, 2026 @ 16:00 (Instructor 1) - Pending
   - Booked on: February 16, 2026

### Statistics

**Users:**
- 100 total users
- Mix of Albanian, Macedonian, and English names
- Realistic email addresses (@example.com)
- Macedonian phone numbers (070XXXXXX)
- Each user makes 2-4 bookings

**Packages Distribution (Random):**
- ~25% Single Session (600 DEN)
- ~25% 8 Sessions (3500 DEN)
- ~25% 10 Sessions (4200 DEN)
- ~25% 12 Sessions (4800 DEN)

**Booking Status:**
- 70% Confirmed
- 30% Pending

**Daily Coverage:**
- Every weekday has multiple bookings
- Average 8-15 bookings per day
- Mix of morning and evening slots
- All instructors represented each day

**Languages:**
- 33% Albanian (sq)
- 33% Macedonian (mk)
- 33% English (en)

**Payment:**
- 50% Pay in Studio
- 50% Prepaid

### Sample Users

1. **Arjeta Hoxha** - arjeta.hoxha0@example.com - 070542367
2. **Elena Petrov** - elena.petrov1@example.com - 070891234
3. **Luan Krasniqi** - luan.krasniqi2@example.com - 070234789
4. **Marija Stojanovski** - marija.stojanovski3@example.com - 070678912
5. **Stefan Nikolovski** - stefan.nikolovski4@example.com - 070445678

### Admin Panel Views

**Calendar Tab:**
- Shows 26 weekdays with bookings (Jan 23 - Feb 28)
- Each day shows 7 time slots
- Color coding: Green (confirmed), Yellow (pending)
- Capacity indicator: X/4 per slot
- Every day has bookings distributed across various time slots
- Can navigate through weeks using date tabs

**Users Tab:**
- List of 100 users
- Filter by Confirmed/Pending
- User details expandable
- Shows booking history for each user
- Actions: Delete, Block, Gift Sessions

### Testing Scenarios

1. **High Capacity Days**: Some days will have 15-20+ bookings
2. **Full Slots**: Some time slots may reach 3/4 or 4/4 capacity
3. **Mixed Status**: Each day has both confirmed and pending bookings
4. **User Variety**: Different packages and session counts
5. **Instructor Distribution**: Bookings spread across all 3 instructors
6. **Complete Coverage**: Every single weekday from Jan 23 - Feb 28 has bookings
7. **Month Transition**: Test calendar navigation across January/February boundary
8. **Long-term View**: Full month+ of bookings visible in admin panel
