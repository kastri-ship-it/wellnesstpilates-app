# Testing Mock Data Integration

## Overview

The mock data system now integrates across **all parts of the application**:

1. ✅ **Admin Panel Calendar** - Shows all bookings with capacity indicators
2. ✅ **Admin Panel Users** - Lists all 100 mock users with booking history  
3. ✅ **User Booking Interface** - Shows real-time availability based on bookings
4. ✅ **User Dashboard** - Displays reduced availability when booking new sessions
5. ✅ **Real-time Sync** - All views update from the same backend data

---

## Step-by-Step Testing Guide

### 1️⃣ Generate Mock Data

**Action**: Open Admin Panel → Click ⚙️ icon → Generate Mock Data

**Expected Result**:
- ✅ Success message appears
- ✅ Console logs: "Generated 26 weekdays between Jan 23 and Feb 28, 2026"
- ✅ Console logs: "Created 100 users"
- ✅ Console logs: "Created ~200-400 bookings"

---

### 2️⃣ Test Admin Panel - Calendar View

**Action**: Admin Panel → Calendar Tab

**What to Look For**:

#### Date Navigation
- ✅ See dates from Jan 23 through Feb 28
- ✅ Only weekdays shown (Mon-Fri)
- ✅ Weekend dates skipped automatically

#### Daily View Example (Feb 5, 2026)
```
08:00 - 08:50   [2/4]  👤👤
09:00 - 09:50   [1/4]  👤
10:00 - 10:50   [2/4]  👤👤
11:00 - 11:50   [1/4]  👤
16:00 - 16:50   [3/4]  👤👤👤
17:00 - 17:50   [2/4]  👤👤
18:00 - 18:50   [1/4]  👤
```

#### Each Booking Shows:
- Name & Surname
- Email
- Phone
- Status (Green = Confirmed, Yellow = Pending)
- Package type
- Activation code

#### Expected Patterns:
- ✅ Every day has bookings (no empty days)
- ✅ 8-15 bookings per day on average
- ✅ Some slots near capacity (3/4 or 4/4)
- ✅ Most slots have availability (1/4 or 2/4)
- ✅ ~70% confirmed (green), ~30% pending (yellow)

---

### 3️⃣ Test Admin Panel - Users View

**Action**: Admin Panel → Users Tab

**What to Look For**:

#### User List
- ✅ 100 users displayed
- ✅ Mix of Albanian, Macedonian, and English names
- ✅ Various package types:
  - Single Session (600 DEN)
  - 8 Sessions (3500 DEN)
  - 10 Sessions (4200 DEN)
  - 12 Sessions (4800 DEN)

#### User Details (Click to Expand)
- ✅ Email: `name.surname@example.com`
- ✅ Phone: 070XXXXXXX (Macedonian format)
- ✅ Activation Code: WN-XXXX-XXXX
- ✅ Sessions Remaining: 0-12
- ✅ Booking count: 2-4 bookings per user
- ✅ Registration date: Jan 1-22, 2026

#### Example User Profile:
```
Name: Marija Stojanovski
Email: marija.stojanovski3@example.com
Phone: 070123456
Package: 12 Sessions (4800 DEN)
Remaining: 8 sessions
Status: Confirmed
Activation Code: WN-RTYK-9HF3

Bookings:
✅ Jan 24, 2026 @ 09:00 (Confirmed)
✅ Jan 29, 2026 @ 17:00 (Confirmed)
✅ Feb 5, 2026 @ 10:00 (Confirmed)
⏳ Feb 18, 2026 @ 16:00 (Pending)
```

---

### 4️⃣ Test User Booking Interface (Guest View)

**Action**: Main App → "Rezervim klasë të vetme" → Select Date

**What to Look For**:

#### Before Mock Data
```
E PREMTE, 23 Janar
08:00 - 08:50    [4 vende të lira]  ← All green
09:00 - 09:50    [4 vende të lira]  ← All green
10:00 - 10:50    [4 vende të lira]  ← All green
...
```

#### After Mock Data
```
E PREMTE, 23 Janar
08:00 - 08:50    [4 vende të lira]  ← Still available
09:00 - 09:50    [3 vende të lira]  ← 1 booked! 
10:00 - 10:50    [4 vende të lira]  ← Still available
11:00 - 11:50    [4 vende të lira]  ← Still available
16:00 - 16:50    [2 vende të lira]  ← 2 booked!
17:00 - 17:50    [1 vend i lirë]    ← 3 booked! Orange color
18:00 - 18:50    [4 vende të lira]  ← Still available
```

#### Color Coding
- 🟢 **Green** (bg-[#9ca571]) = 2-4 spots available
- 🟠 **Orange** (bg-[#d4a574]) = 1 spot available
- ⚫ **Gray** (bg-[#cccccc]) = 0 spots (fully booked)

#### Navigation
- ✅ Swipe through dates from Jan 23 to Feb 28
- ✅ Every weekday shows different availability
- ✅ Some days busier than others

---

### 5️⃣ Test User Dashboard (Logged In User)

**Action**: 
1. Create a new user account or login
2. Navigate to "Rezervo një klasë të re" section

**What to Look For**:

#### Booking Calendar in Dashboard
```
23 Janar 2026
□ 08:00 - 08:50    [4 vende të lira]
□ 09:00 - 09:50    [3 vende të lira]  ← Mock booking here
□ 10:00 - 10:50    [4 vende të lira]
□ 11:00 - 11:50    [4 vende të lira]
□ 16:00 - 16:50    [2 vende të lira]  ← Mock bookings here
□ 17:00 - 17:50    [1 vend i lirë]    ← Mock bookings here
□ 18:00 - 18:50    [4 vende të lira]
```

#### When Booking a Slot
1. Click available slot (e.g., "08:00 - [4 vende të lira]")
2. ✅ Booking created successfully
3. ✅ Availability updates: "4 vende të lira" → "3 vende të lira"
4. ✅ User's sessions remaining decrements
5. ✅ Booking appears in "Rezervimet e mia" section

---

### 6️⃣ Test Real-Time Sync Across Views

**Test Scenario**: Book a slot and verify it updates everywhere

**Steps**:
1. **User View**: Book slot (Feb 5 @ 10:00)
2. **Verify in User Dashboard**: Shows in "My Bookings"
3. **Verify in Booking Interface**: Availability decreases
4. **Verify in Admin Calendar**: New booking appears
5. **Verify in Admin Users**: User's booking count increases

**Expected Flow**:
```
User books → Backend saves → All views refresh → Consistent data everywhere
```

---

### 7️⃣ Test Specific Dates

#### Early Dates (Jan 23-24)
- ✅ Should have bookings
- ✅ Lighter booking volume (6-10 bookings per day)

#### Mid-Period (Feb 5-13)
- ✅ Should have bookings
- ✅ Medium booking volume (8-12 bookings per day)
- ✅ Some popular slots near capacity

#### Late Dates (Feb 23-27)
- ✅ Should have bookings
- ✅ Booking patterns spread throughout day
- ✅ End of month still active

---

### 8️⃣ Test Capacity Limits

**Find a Nearly Full Slot**:
1. Browse through days in booking interface
2. Find slot showing "1 vend i lirë" (orange)
3. Book that slot as a new user
4. ✅ Slot should become "Asnjë vend i lirë" (gray, disabled)
5. ✅ Other users can no longer book that slot

---

### 9️⃣ Test Filter & Search

**In Admin Panel - Users Tab**:

#### Filter by Status
- Click "Confirmed" → See only confirmed bookings
- Click "Pending" → See only pending bookings
- Click "All" → See everything

#### Search by Name
- Type "Marija" → Find users with that name
- Type email → Find specific user
- Type phone → Find by phone number

---

### 🔟 Test Edge Cases

#### Weekend Dates
- ✅ No bookings on Sat/Sun (system only generates weekdays)
- ✅ Booking interface skips weekends automatically

#### Past Dates
- ✅ Cannot book dates before "today"
- ✅ Past time slots on current day are disabled

#### Full Capacity Days
- ✅ Find day with many bookings
- ✅ Some slots should be at 4/4 capacity
- ✅ Cannot book fully booked slots

---

## Verification Checklist

Use this checklist to confirm everything works:

### Data Generation
- [ ] Mock data generates without errors
- [ ] Console logs show 100 users created
- [ ] Console logs show 200-400 bookings created
- [ ] Date range is Jan 23 - Feb 28, 2026

### Admin Panel - Calendar
- [ ] All 26 weekdays show bookings
- [ ] Every day has at least 1 booking
- [ ] Capacity indicators show correct numbers (X/4)
- [ ] Can click bookings to see details
- [ ] Can filter by confirmed/pending
- [ ] Can navigate between weeks

### Admin Panel - Users
- [ ] 100 users displayed
- [ ] Each user has 2-4 bookings
- [ ] Package types are diverse
- [ ] Activation codes follow WN-XXXX-XXXX format
- [ ] Can expand user details
- [ ] Can search/filter users

### User Booking Interface
- [ ] Shows reduced availability (not all "4 vende të lira")
- [ ] Some slots show 3, 2, or 1 spots available
- [ ] Color coding works (green/orange/gray)
- [ ] Every day from Jan 23-Feb 28 accessible
- [ ] Can book available slots
- [ ] Fully booked slots are disabled

### User Dashboard
- [ ] Calendar shows realistic availability
- [ ] Can book available slots
- [ ] Bookings sync to database
- [ ] "My Bookings" section updates
- [ ] Sessions remaining decrements

### Real-Time Sync
- [ ] Booking in user view updates admin panel
- [ ] Booking in dashboard updates booking interface
- [ ] Multiple views show consistent data
- [ ] Refresh updates all views

---

## Common Issues & Solutions

### Issue: All slots still show "4 vende të lira"

**Cause**: Mock data not generated or dateKey format mismatch

**Solution**:
1. Open browser console
2. Check for errors during data generation
3. Verify console logs show bookings created
4. Refresh the page after generating data
5. Check dateKey format in bookings: should be "1-23", "2-5", etc.

---

### Issue: Admin panel shows bookings but user interface doesn't

**Cause**: Different dateKey formats being used

**Solution**:
1. Check console for booking fetch errors
2. Verify dateKey format consistency: `"1-23"` not `"2026-01-23"`
3. Clear all data and regenerate

---

### Issue: Bookings not appearing on specific dates

**Cause**: Date filtering or timezone issues

**Solution**:
1. Verify the date is a weekday (Mon-Fri)
2. Check if date is in range (Jan 23 - Feb 28)
3. Look at raw booking data in admin panel
4. Check browser timezone settings

---

### Issue: Capacity not updating after booking

**Cause**: Page not refreshing or state not updating

**Solution**:
1. Wait 30 seconds for auto-refresh
2. Manually refresh the page
3. Check network tab for successful POST request
4. Verify booking saved in admin panel

---

## Success Metrics

Your mock data integration is successful if:

✅ **100% Coverage**: Every weekday from Jan 23-Feb 28 has bookings  
✅ **Realistic Patterns**: Mix of busy and light days  
✅ **Visual Variety**: Different availability numbers (not all 4/4 or 0/4)  
✅ **Multi-View Sync**: Same data across booking interface, dashboard, and admin panel  
✅ **Accurate Capacity**: Capacity calculations match actual booking count  
✅ **User Experience**: Clear when slots are filling up (color coding works)  

---

## Advanced Testing

### Load Testing
1. Generate mock data multiple times
2. Verify no duplicate bookings
3. Check performance with 400+ bookings

### Data Integrity
1. Compare booking count in admin vs. availability calculations
2. Verify each booking has valid dateKey
3. Check all required fields present

### Edge Case Validation
1. Book last available spot → slot becomes disabled
2. Try booking disabled slot → prevented
3. Check month boundary (Jan → Feb transition)

---

## Debugging Commands

Open browser console and run:

```javascript
// Check total bookings
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-b87b0c07/bookings', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
})
.then(r => r.json())
.then(d => console.log('Total bookings:', d.bookings.length))

// Check bookings for specific date
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-b87b0c07/bookings', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
})
.then(r => r.json())
.then(d => {
  const feb5 = d.bookings.filter(b => b.dateKey === '2-5');
  console.log('Feb 5 bookings:', feb5.length, feb5);
})

// Check specific time slot
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-b87b0c07/bookings', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
})
.then(r => r.json())
.then(d => {
  const slot = d.bookings.filter(b => b.dateKey === '2-5' && b.timeSlot === '17:00');
  console.log('Feb 5 @ 17:00:', slot.length, '/4 spots');
})
```

---

## Final Notes

- Mock data is **persistent** until you clear it via Dev Tools
- You can **regenerate** to add more users/bookings (will append, not replace)
- Use **"Clear All Data"** in Dev Tools for a fresh start
- Mock emails are fake (`@example.com`) so no real emails are sent
- Activation codes are randomly generated (WN-XXXX-XXXX format)

**Happy Testing! 🎉**
