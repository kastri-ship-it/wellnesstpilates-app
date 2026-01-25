# Admin Panel Guide - Wellnest Pilates

## Access Instructions

### Login Credentials
- **Username:** admin
- **Password:** admin

### How to Access
1. On the main booking screen, hover over the **bottom-right corner** to reveal a small hidden button
2. Click the hidden button to navigate to the admin login screen
3. Enter the credentials above
4. You'll be redirected to the admin panel

---

## Admin Panel Features

### 1. Calendar View (Tab 1)

**Full Calendar Display:**
- Shows 14 days across 3 weeks
- Each date shows the number of bookings
- Click any date to see detailed bookings for that day

**Booking Details:**
When you click on a date, you'll see:
- **User Name:** Full name of the person who booked
- **Time:** Booking time slot
- **Package Type:** 
  - Single Session
  - 8 Sessions Package
  - 12 Sessions Package
- **Status Badge (Color-Coded):**
  - 🟢 **Green (Paid):** Member who has paid
  - 🟡 **Yellow (Reserved):** First-time user, reserved but hasn't paid
  - 🔵 **Blue (Code Sent):** Email with activation code sent, waiting for confirmation

---

### 2. User Database (Tab 2)

**Full User Table:**
Displays all registered users with:
- Name
- Surname
- Phone Number
- Email
- Status (color-coded badge)
- Actions

**Status Management:**
- **Click on any status badge** to cycle through statuses:
  - Reserved → Code Sent → Paid → Reserved (loops)
- Color coding:
  - 🟢 Green = Paid
  - 🟡 Yellow = Reserved
  - 🔵 Blue = Code Sent - Waiting for Confirmation

**Send Activation Code:**
- For users with "Reserved" status, a **"Send Code"** button appears
- Click to send an activation code via email
- A confirmation modal appears showing user details
- After confirming:
  - Email is sent to the user with their activation code
  - Status automatically changes to **"Code Sent - Waiting for Confirmation"** (Blue)

**Automatic Status Update Flow:**
1. Admin sends code to reserved user → Status: "Code Sent" (Blue)
2. User receives email with activation code (e.g., PILATES8, PILATES12, WELLNEST2025)
3. User logs into the app/website and enters the code
4. Status automatically changes to **"Paid"** (Green)

---

## Mock User Data

The admin panel includes 8 sample users showing different statuses:

1. **Marko Petrov** - Paid (Green) - 8 Sessions Package
2. **Ana Stojanović** - Reserved (Yellow) - 12 Sessions Package
3. **Stefan Nikolov** - Paid (Green) - Single Session
4. **Elena Dimitrova** - Code Sent (Blue) - 8 Sessions Package
5. **Nikola Trajkovski** - Reserved (Yellow) - Single Session
6. **Jovana Petrović** - Paid (Green) - 12 Sessions Package
7. **Dejan Kostov** - Reserved (Yellow) - 8 Sessions Package
8. **Marija Ilievska** - Code Sent (Blue) - 12 Sessions Package

---

## Activation Codes

Valid activation codes that users can enter:
- **PILATES8** - Unlocks 8 Sessions Package
- **PILATES12** - Unlocks 12 Sessions Package
- **WELLNEST2025** - Unlocks all packages

---

## Key Features Summary

✅ **Login:** admin/admin
✅ **Full 14-day calendar view**
✅ **Click dates to see all bookings**
✅ **Color-coded status system** (Green=Paid, Yellow=Reserved, Blue=Code Sent)
✅ **User database with full contact information**
✅ **Quick status switching** (click badge to change)
✅ **Email code generation** for reserved users
✅ **Automatic status updates** when users activate codes
✅ **Professional admin interface** with logout functionality

---

## Logout

Click the **Logout button** (top-right corner) to exit the admin panel and return to the main booking screen.
