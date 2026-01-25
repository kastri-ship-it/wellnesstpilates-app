# Admin Panel Preview - Mock Data

## What You'll See After Generating Mock Data

### 📊 Dashboard Statistics
- **Total Users**: 100
- **Total Bookings**: 200-400
- **Date Range**: January 23 - February 28, 2026
- **Active Days**: 26 weekdays
- **Confirmed**: ~70% of bookings
- **Pending**: ~30% of bookings

---

## 📅 Calendar View

### Week-by-Week Breakdown

#### Week 1: Jan 23-24 (2 days)
```
Thu 23 Jan - 8-12 bookings across 7 time slots
Fri 24 Jan - 8-12 bookings across 7 time slots
```

#### Week 2: Jan 27-31 (5 days)
```
Mon 27 Jan - 8-12 bookings
Tue 28 Jan - 8-12 bookings
Wed 29 Jan - 8-12 bookings
Thu 30 Jan - 8-12 bookings
Fri 31 Jan - 8-12 bookings
```

#### Week 3: Feb 2-6 (5 days)
```
Mon 2 Feb - 8-12 bookings
Tue 3 Feb - 8-12 bookings
Wed 4 Feb - 8-12 bookings
Thu 5 Feb - 8-12 bookings
Fri 6 Feb - 8-12 bookings
```

#### Week 4: Feb 9-13 (5 days)
```
Mon 9 Feb - 8-12 bookings
Tue 10 Feb - 8-12 bookings
Wed 11 Feb - 8-12 bookings
Thu 12 Feb - 8-12 bookings
Fri 13 Feb - 8-12 bookings
```

#### Week 5: Feb 16-20 (5 days)
```
Mon 16 Feb - 8-12 bookings
Tue 17 Feb - 8-12 bookings
Wed 18 Feb - 8-12 bookings
Thu 19 Feb - 8-12 bookings
Fri 20 Feb - 8-12 bookings
```

#### Week 6: Feb 23-27 (5 days)
```
Mon 23 Feb - 8-12 bookings
Tue 24 Feb - 8-12 bookings
Wed 25 Feb - 8-12 bookings
Thu 26 Feb - 8-12 bookings
Fri 27 Feb - 8-12 bookings
```

---

## 🕐 Time Slot Distribution (Example Day)

### Typical Day View in Admin Panel

**Date: February 5, 2026 (Thursday)**

| Time Slot | Capacity | Status Distribution |
|-----------|----------|---------------------|
| 08:00-08:50 | 2/4 | 1 Confirmed, 1 Pending |
| 09:00-09:50 | 1/4 | 1 Confirmed |
| 10:00-10:50 | 2/4 | 2 Confirmed |
| 11:00-11:50 | 1/4 | 1 Pending |
| 16:00-16:50 | 3/4 | 2 Confirmed, 1 Pending |
| 17:00-17:50 | 2/4 | 1 Confirmed, 1 Pending |
| 18:00-18:50 | 1/4 | 1 Confirmed |

**Total for Day**: 12 bookings

---

## 👥 Users Tab

### Sample User List (sorted by registration date)

1. **Arjeta Hoxha** - arjeta.hoxha0@example.com
   - Package: 8 Sessions | Remaining: 5
   - Bookings: 3 (2 Confirmed, 1 Pending)
   - Activation Code: WN-AB12-CD34

2. **Stefan Nikolovski** - stefan.nikolovski1@example.com
   - Package: 10 Sessions | Remaining: 7
   - Bookings: 3 (3 Confirmed)
   - Activation Code: WN-EF56-GH78

3. **Elena Petrov** - elena.petrov2@example.com
   - Package: Single Session | Remaining: 0
   - Bookings: 1 (1 Confirmed)
   - Activation Code: WN-IJ90-KL12

4. **Marija Stojanovski** - marija.stojanovski3@example.com
   - Package: 12 Sessions | Remaining: 8
   - Bookings: 4 (3 Confirmed, 1 Pending)
   - Activation Code: WN-MN34-OP56

... and 96 more users

---

## 📱 User Dashboard View

### When User Logs In (Example: Marija Stojanovski)

**My Bookings:**

✅ **January 24, 2026** @ 09:00 - Instructor 1 (Confirmed)  
✅ **January 29, 2026** @ 17:00 - Instructor 2 (Confirmed)  
✅ **February 5, 2026** @ 10:00 - Instructor 3 (Confirmed)  
⏳ **February 18, 2026** @ 16:00 - Instructor 1 (Pending)

**Package Info:**
- Package: 12 Sessions (4800 DEN)
- Sessions Remaining: 8

**Book New Session:**
Shows calendar with available slots from current date through February 28

---

## 🔍 Filtering & Search Capabilities

### Admin Panel Filters:

1. **By Status**
   - Show All (200-400 bookings)
   - Confirmed Only (~140-280 bookings)
   - Pending Only (~60-120 bookings)

2. **By Date Range**
   - Navigate by week
   - Jump to specific date
   - View full month

3. **By Instructor**
   - Instructor 1 bookings
   - Instructor 2 bookings
   - Instructor 3 bookings

4. **By User**
   - Search by name, email, or phone
   - View user's booking history
   - See package details

---

## 📈 Expected Metrics

### Booking Density

- **Light Days** (6-8 bookings): ~30% of days
- **Medium Days** (9-12 bookings): ~50% of days
- **Heavy Days** (13-16 bookings): ~20% of days

### Peak Time Slots

Most Popular Times:
1. 17:00-17:50 (Evening - highest demand)
2. 09:00-09:50 (Morning - second highest)
3. 18:00-18:50 (Late evening)

Least Popular Times:
1. 11:00-11:50 (Late morning)
2. 16:00-16:50 (Early evening)

### Instructor Distribution

- Instructor 1: ~33% of bookings
- Instructor 2: ~33% of bookings
- Instructor 3: ~33% of bookings

---

## ✨ Key Features Demonstrated

1. ✅ **Full Month Coverage** - Every weekday has bookings
2. ✅ **Realistic Distribution** - Mix of busy and light days
3. ✅ **Multiple Users per Slot** - Shows capacity management
4. ✅ **Status Variety** - Both confirmed and pending visible
5. ✅ **Multi-language** - Albanian, Macedonian, English users
6. ✅ **Package Diversity** - All 4 package types represented
7. ✅ **Timeline Consistency** - Bookings created before appointment dates
8. ✅ **Complete User Journeys** - From registration → booking → attendance

---

## 🎯 Perfect for Testing

This mock data setup allows you to test:

- Calendar navigation across weeks
- Booking management for different dates
- User filtering and search
- Capacity indicators (spots remaining)
- Email and notification systems
- Payment tracking (studio vs prepaid)
- Multi-instructor scheduling
- Package session tracking
- Activation code management
- Pending vs confirmed workflows

**Result**: A fully populated, realistic Pilates studio booking system spanning 5+ weeks!
