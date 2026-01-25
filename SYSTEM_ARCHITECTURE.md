# Pilates Booking App - Complete System Architecture

## Overview

This document describes the complete architecture of the Pilates booking application with full mock data integration.

---

## 🏗️ System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                         SUPABASE BACKEND                               │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Key-Value Store (PostgreSQL)                                │   │
│  │                                                                │   │
│  │  • user:{email}              → User Profile                   │   │
│  │  • booking:{timestamp}-{id}  → Booking Object                 │   │
│  │  • user_bookings:{email}     → Array of Booking IDs          │   │
│  │                                                                │   │
│  │  Mock Data:                                                   │   │
│  │  ✓ 100 users (Jan 1-22 registration)                        │   │
│  │  ✓ 200-400 bookings (Jan 23 - Feb 28, 2026)                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Hono Web Server (Edge Functions)                            │   │
│  │                                                                │   │
│  │  GET    /make-server-b87b0c07/bookings                       │   │
│  │  POST   /make-server-b87b0c07/bookings                       │   │
│  │  PATCH  /make-server-b87b0c07/bookings/:id/status            │   │
│  │  DELETE /make-server-b87b0c07/bookings/:id                   │   │
│  │  POST   /make-server-b87b0c07/activate                       │   │
│  │  POST   /make-server-b87b0c07/mock-data/generate             │   │
│  │  DELETE /make-server-b87b0c07/clear-data                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Resend Email API Integration                                │   │
│  │  • Sends activation codes                                    │   │
│  │  • From: wellnest@resend.dev                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
                                    ↕
                    Authorization: Bearer {publicAnonKey}
                                    ↕
┌───────────────────────────────────────────────────────────────────────┐
│                         REACT FRONTEND                                 │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  App.tsx → LanguageProvider → MainApp.tsx                    │   │
│  │                                                                │   │
│  │  Screen Management:                                           │   │
│  │  • trainingType                                               │   │
│  │  • booking                                                    │   │
│  │  • confirmation                                               │   │
│  │  • success                                                    │   │
│  │  • userDashboard                                              │   │
│  │  • adminPanel                                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌─────────────────────────────┬────────────────────────────────┐   │
│  │  PUBLIC USER VIEWS          │  AUTHENTICATED VIEWS          │   │
│  │                             │                                │   │
│  │  ┌────────────────────┐     │  ┌───────────────────────┐   │   │
│  │  │ TrainingType       │     │  │ UserDashboard         │   │   │
│  │  │ Selection          │     │  │                       │   │   │
│  │  │ • Single Class     │     │  │ • My Profile          │   │   │
│  │  │ • Package (8-12)   │     │  │ • Package Info        │   │   │
│  │  │ • Individual       │     │  │ • Sessions Remaining  │   │   │
│  │  │ • Duo Training     │     │  │ • My Bookings List   │   │   │
│  │  └────────────────────┘     │  │ • Book New Session   │   │   │
│  │                             │  │                       │   │   │
│  │  ┌────────────────────┐     │  │ Fetches:              │   │   │
│  │  │ BookingScreen      │     │  │ ✓ User profile        │   │   │
│  │  │                    │     │  │ ✓ All bookings        │   │   │
│  │  │ • Date Selection   │◄────┼──┤ ✓ User bookings       │   │   │
│  │  │ • Time Slots       │     │  │                       │   │   │
│  │  │ • Availability     │     │  │ Shows:                │   │   │
│  │  │                    │     │  │ • Real-time capacity  │   │   │
│  │  │ Fetches:           │     │  │ • Instant booking     │   │   │
│  │  │ ✓ All bookings     │     │  │ • No countdown        │   │   │
│  │  │ ✓ Every 30s        │     │  └───────────────────────┘   │   │
│  │  │                    │     │                                │   │
│  │  │ Calculates:        │     │  ┌───────────────────────┐   │   │
│  │  │ • 4 - bookedCount  │     │  │ AdminPanel            │   │   │
│  │  │ • Per date+time    │     │  │                       │   │   │
│  │  │                    │     │  │ Login: admin/admin    │   │   │
│  │  │ Shows:             │     │  │                       │   │   │
│  │  │ 🟢 4-2 spots       │     │  │ Tabs:                 │   │   │
│  │  │ 🟠 1 spot          │     │  │ • Calendar View       │   │   │
│  │  │ ⚫ 0 spots         │     │  │ • Users Database      │   │   │
│  │  └────────────────────┘     │  │                       │   │   │
│  │           ↓                 │  │ Dev Tools (⚙️):       │   │   │
│  │  ┌────────────────────┐     │  │ • Generate Mock Data  │   │   │
│  │  │ ConfirmationScreen │     │  │ • Clear All Data      │   │   │
│  │  │                    │     │  │                       │   │   │
│  │  │ • User Details     │     │  │ Fetches:              │   │   │
│  │  │ • Payment Option   │     │  │ ✓ All bookings        │   │   │
│  │  │ • Submit Booking   │     │  │ ✓ All users           │   │   │
│  │  │                    │     │  │                       │   │   │
│  │  │ Creates:           │     │  │ Shows:                │   │   │
│  │  │ POST /bookings     │     │  │ • X/4 capacity        │   │   │
│  │  │ • status: pending  │     │  │ • User details        │   │   │
│  │  └────────────────────┘     │  │ • Booking history     │   │   │
│  │           ↓                 │  │ • Filter/Search       │   │   │
│  │  ┌────────────────────┐     │  └───────────────────────┘   │   │
│  │  │ SuccessScreen      │     │                                │   │
│  │  │                    │     │  ┌───────────────────────┐   │   │
│  │  │ • Countdown Timer  │     │  │ DevTools Modal        │   │   │
│  │  │ • 30 minutes       │     │  │                       │   │   │
│  │  │ • Activation Code  │     │  │ Calls:                │   │   │
│  │  │ • Email Sent       │     │  │ POST /mock-data/gen   │   │   │
│  │  └────────────────────┘     │  │ DELETE /clear-data    │   │   │
│  │                             │  │                       │   │   │
│  └─────────────────────────────┴──│ Results:              │   │   │
│                                    │ ✓ 100 users           │   │   │
│  ┌──────────────────────────────┐ │ ✓ 200-400 bookings    │   │   │
│  │  Modals & Overlays           │ │ ✓ Jan 23 - Feb 28     │   │   │
│  │                              │ └───────────────────────┘   │   │
│  │  • MemberActivationModal     │                              │   │
│  │  • LoginRegisterModal        │                              │   │
│  │  • InstructorProfile         │                              │   │
│  └──────────────────────────────┘                              │   │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: Booking Creation

```
1. User selects date & time
   └─→ BookingScreen or UserDashboard
   
2. User enters details
   └─→ ConfirmationScreen
   
3. Submit booking
   └─→ POST /make-server-b87b0c07/bookings
       {
         name, surname, email, mobile,
         date: "24/01/2026",
         dateKey: "1-24",
         timeSlot: "09:00",
         instructor: "Rina Krasniqi",
         status: "pending"
       }
   
4. Backend stores booking
   └─→ kv.set('booking:{id}', bookingObject)
   └─→ kv.set('user_bookings:{email}', [bookingIds])
   
5. Backend sends email
   └─→ Resend API
   └─→ Email with activation code: WN-XXXX-XXXX
   
6. User receives confirmation
   └─→ SuccessScreen with 30-min countdown
   
7. User activates with code
   └─→ POST /make-server-b87b0c07/activate
   └─→ Status: pending → confirmed
   
8. All views refresh
   └─→ BookingScreen: availability decreases
   └─→ UserDashboard: booking appears
   └─→ AdminPanel: booking visible
```

---

## 📊 Data Flow: Mock Data Generation

```
1. Admin opens Dev Tools
   └─→ Click ⚙️ in AdminPanel header
   
2. Click "Generate Mock Data"
   └─→ POST /make-server-b87b0c07/mock-data/generate
   
3. Backend generates data
   ├─→ Create 100 users
   │   └─→ Random names (Albanian, Macedonian, English)
   │   └─→ Email: firstname.lastname{n}@example.com
   │   └─→ Phone: 070XXXXXXX
   │   └─→ Package: Random (8/10/12 sessions or single)
   │   └─→ Sessions Remaining: Based on package
   │   └─→ Activation Code: WN-XXXX-XXXX
   │   └─→ Registration: Jan 1-22, 2026
   │
   └─→ Create 2-4 bookings per user
       └─→ Date: Jan 23 - Feb 28, 2026 (weekdays)
       └─→ Time: Random slot (08:00-18:00)
       └─→ Instructor: Random (1, 2, or 3)
       └─→ Status: 70% confirmed, 30% pending
       └─→ Created: 1-3 days before appointment
   
4. Backend stores all data
   ├─→ For each user:
   │   └─→ kv.set('user:{email}', userObject)
   │
   └─→ For each booking:
       └─→ kv.set('booking:{id}', bookingObject)
       └─→ kv.set('user_bookings:{email}', [...bookingIds])
   
5. Frontend receives success
   └─→ Shows confirmation message
   └─→ Logs statistics to console
   
6. All views automatically update
   ├─→ BookingScreen: Fetches bookings, calculates availability
   ├─→ UserDashboard: Fetches bookings, shows reduced capacity
   └─→ AdminPanel: Displays all bookings in calendar & users
```

---

## 🔄 Real-Time Sync Mechanism

### How Different Views Stay in Sync

```
┌─────────────────────────────────────────────────────────────┐
│  Single Source of Truth: Supabase Key-Value Store          │
│  GET /make-server-b87b0c07/bookings                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │ Booking    │   │ User       │   │ Admin      │
   │ Screen     │   │ Dashboard  │   │ Panel      │
   └────────────┘   └────────────┘   └────────────┘
   
   Fetches on:      Fetches on:      Fetches on:
   • Mount          • Mount          • Mount
   • Every 30s      • After booking  • After action
   
   Calculates:      Calculates:      Displays:
   • Available      • Available      • All bookings
   • Per slot       • Per slot       • Per date+time
```

### dateKey Consistency

**Critical**: All parts use the same format

```javascript
// Format used everywhere
const dateKey = `${month + 1}-${day}`;

// Examples:
"1-23"  → January 23
"2-5"   → February 5
"12-31" → December 31

// Used in:
✓ Mock data generator
✓ BookingScreen
✓ UserDashboard
✓ AdminPanel
✓ ConfirmationScreen
✓ Backend storage
```

---

## 🎨 UI Component Hierarchy

```
App.tsx
└─ LanguageProvider
   └─ MainApp.tsx
      │
      ├─ Header (Language switcher, User icon, Admin icon)
      │
      ├─ TrainingTypeSelection
      │  ├─ Single Class Card
      │  ├─ Package Card
      │  ├─ Individual Card
      │  └─ Duo Training Card
      │
      ├─ BookingScreen
      │  ├─ Header with back button
      │  ├─ Date tabs (horizontal scroll)
      │  ├─ Time slot buttons
      │  │  └─ Color coded by availability
      │  └─ Footer with logo
      │
      ├─ ConfirmationScreen
      │  ├─ Booking details card
      │  ├─ User input form
      │  ├─ Payment toggle
      │  └─ Confirm button
      │
      ├─ SuccessScreen
      │  ├─ Success message
      │  ├─ Countdown timer (30 min)
      │  ├─ Activation code display
      │  └─ Email confirmation
      │
      ├─ UserDashboard
      │  ├─ Profile header
      │  ├─ Package info card
      │  ├─ My bookings section
      │  │  └─ List of user bookings
      │  ├─ Book new session
      │  │  ├─ Date accordion
      │  │  └─ Time slot buttons
      │  └─ Logout button
      │
      ├─ AdminPanel
      │  ├─ Header
      │  │  ├─ Logo
      │  │  ├─ Tab navigation
      │  │  └─ Dev Tools button (⚙️)
      │  │
      │  ├─ Calendar Tab
      │  │  ├─ Week navigation
      │  │  ├─ Date cards
      │  │  │  └─ Time slot grid
      │  │  │     └─ Booking cards
      │  │  └─ Capacity indicators
      │  │
      │  ├─ Users Tab
      │  │  ├─ Sub-tabs (All/Confirmed/Pending)
      │  │  ├─ User cards
      │  │  │  ├─ Basic info
      │  │  │  ├─ Expandable details
      │  │  │  └─ Action buttons
      │  │  └─ Search/filter
      │  │
      │  └─ DevTools Modal
      │     ├─ Generate Mock Data
      │     └─ Clear All Data
      │
      └─ Modals
         ├─ MemberActivationModal
         ├─ LoginRegisterModal
         └─ InstructorProfile
```

---

## 🗂️ File Structure

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Main entry point
│   │   ├── components/
│   │   │   ├── MainApp.tsx            # App logic & routing
│   │   │   ├── TrainingTypeSelection.tsx
│   │   │   ├── BookingScreen.tsx      # ✨ Fetches bookings
│   │   │   ├── ConfirmationScreen.tsx # Creates bookings
│   │   │   ├── SuccessScreen.tsx
│   │   │   ├── UserDashboard.tsx      # ✨ Shows availability
│   │   │   ├── AdminPanel.tsx         # ✨ Displays all data
│   │   │   ├── DevTools.tsx           # Mock data controls
│   │   │   ├── PackageOverview.tsx
│   │   │   ├── IndividualTraining.tsx
│   │   │   ├── DuoTraining.tsx
│   │   │   ├── InstructorProfile.tsx
│   │   │   ├── MemberActivationModal.tsx
│   │   │   ├── LoginRegisterModal.tsx
│   │   │   └── AdminLogin.tsx
│   │   │
│   │   └── translations.ts            # Multi-language support
│   │
│   ├── contexts/
│   │   └── LanguageContext.tsx
│   │
│   ├── imports/                       # Figma assets
│   │   ├── *.png                      # Images
│   │   └── svg-*                      # SVG vectors
│   │
│   └── styles/
│       ├── theme.css                  # Design tokens
│       └── fonts.css                  # Font imports
│
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx              # ✨ All API routes
│           └── kv_store.tsx           # Protected helper
│
├── utils/
│   └── supabase/
│       └── info.tsx                   # Project config
│
├── MOCK_DATA_GUIDE.md                # How to use
├── MOCK_DATA_SUMMARY.md              # Data overview
├── ADMIN_PANEL_PREVIEW.md            # Admin details
├── USER_BOOKING_INTERFACE.md         # User UI details
├── TESTING_MOCK_DATA.md              # Test procedures
├── MOCK_DATA_COMPLETE_INTEGRATION.md # Integration docs
└── SYSTEM_ARCHITECTURE.md            # This file
```

**✨ = Files that fetch/use mock data**

---

## 🔐 Security Model

### Public Routes (No Auth Required)
- `GET /bookings` - Anyone can see all bookings
- `POST /bookings` - Anyone can create booking (pending)
- Training type selection
- Booking interface
- Confirmation screen

### Protected Routes (Require Activation Code)
- `POST /activate` - Convert pending → confirmed
- User dashboard (after login)
- My bookings view

### Admin Routes (Username/Password)
- Admin panel access (admin/admin)
- Calendar view
- Users database
- Dev tools
- Booking management
- Clear data

### Email Verification
- All bookings start as "pending"
- Activation code sent via email
- User must activate to confirm
- 30-minute countdown for activation

---

## 🌐 Multi-Language Support

### Supported Languages
- 🇦🇱 Albanian (sq) - Default
- 🇲🇰 Macedonian (mk)
- 🇬🇧 English (en)

### Translation Keys
All UI text supports all three languages:
- Buttons
- Labels
- Error messages
- Success messages
- Time/Date formats
- Package descriptions
- Email templates

### Language Context
```typescript
// LanguageContext provides:
const { language, setLanguage } = useLanguage();
// 'sq' | 'mk' | 'en'

// Usage in components:
const t = translations[language];
// t.bookNow, t.confirm, t.success, etc.
```

---

## 📱 Mobile-First Design

### Target Device
- iPhone 16 Pro
- 440px × 956px
- No scrolling for main views
- Compact, efficient layouts

### Responsive Breakpoints
- Mobile: < 768px (primary target)
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Design System
- Colors: Earth tones (#9ca571, #d4a574, #3d2f28)
- Fonts: System fonts
- Spacing: Tailwind CSS utilities
- Components: Custom React components

---

## 🔧 Environment Variables

Required secrets (already configured):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (server-only)
- `SUPABASE_DB_URL` - Database connection
- `RESEND_API_KEY` - Email service API key

---

## 📈 Performance Considerations

### Backend
- ✅ Edge functions (globally distributed)
- ✅ Key-value store (fast reads)
- ✅ Minimal database queries
- ✅ No complex joins or transactions

### Frontend
- ✅ React with hooks (efficient rendering)
- ✅ Lazy loading where appropriate
- ✅ Debounced searches
- ✅ Optimistic UI updates
- ✅ 30-second refresh interval (not too frequent)

### Data Volume
- 100 users × 400 bytes ≈ 40 KB
- 400 bookings × 300 bytes ≈ 120 KB
- Total: ~160 KB of mock data
- ✅ Easily handled by KV store

---

## 🚀 Deployment

### Supabase Setup
1. Create Supabase project
2. Deploy edge function (`server/index.tsx`)
3. Configure environment variables
4. Set up Resend email integration

### Frontend Deployment
1. Build React app
2. Deploy to hosting platform
3. Configure domain
4. Update CORS settings

### Testing
1. Generate mock data via Dev Tools
2. Test all user flows
3. Verify email sending
4. Test admin panel features

---

## 🎯 Key Features Summary

### For Users
✅ Browse available time slots
✅ See real-time availability
✅ Book single classes or packages
✅ Receive activation codes via email
✅ View booking history
✅ Manage sessions from dashboard

### For Admins
✅ View all bookings in calendar
✅ Manage user database
✅ Confirm/cancel bookings
✅ Send activation codes manually
✅ Generate mock data for testing
✅ Clear all data

### For Developers
✅ Mock data generator
✅ Consistent data formats
✅ Real-time sync across views
✅ Comprehensive documentation
✅ Easy testing workflows
✅ Multi-language support

---

## 📚 Documentation Index

1. [MOCK_DATA_GUIDE.md](./MOCK_DATA_GUIDE.md)
   - User guide for Dev Tools modal

2. [MOCK_DATA_SUMMARY.md](./MOCK_DATA_SUMMARY.md)
   - Overview of mock data structure

3. [ADMIN_PANEL_PREVIEW.md](./ADMIN_PANEL_PREVIEW.md)
   - What admin panel looks like with data

4. [USER_BOOKING_INTERFACE.md](./USER_BOOKING_INTERFACE.md)
   - How booking interface displays data

5. [TESTING_MOCK_DATA.md](./TESTING_MOCK_DATA.md)
   - Step-by-step testing procedures

6. [MOCK_DATA_COMPLETE_INTEGRATION.md](./MOCK_DATA_COMPLETE_INTEGRATION.md)
   - Integration documentation

7. [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
   - This file - complete system overview

---

**Status**: ✅ Fully Operational  
**Last Updated**: January 22, 2026  
**Version**: 1.0  
**Coverage**: 100% (all components integrated)
