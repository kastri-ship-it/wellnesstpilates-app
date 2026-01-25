# PILATES BOOKING SYSTEM - ARCHITECTURAL REFACTOR

## EXECUTIVE SUMMARY

This document defines the complete architectural refactor from mixed booking logic to a unified Package + Reservation model.

**Core Change**: Replace "Booking" entity with separated "Package" and "Reservation" entities where every checkout creates at least one reservation.

---

## 1. UPDATED DATA MODEL

### 1.1 Entity Definitions

#### User
```typescript
{
  id: string // "user:{email}"
  email: string // unique identifier
  name: string
  surname: string
  mobile: string
  bio?: string
  profileImage?: string
  createdAt: ISO string
  updatedAt: ISO string
  blocked: boolean // admin flag
}
```

#### Package (NEW - Entitlement Container)
```typescript
{
  id: string // "package:{userId}:{timestamp}"
  userId: string // references user:email
  
  // Package type
  packageType: 'single' | 'package4' | 'package8' | 'package12' | 
               'individual1' | 'individual8' | 'individual12' | 
               'duo1' | 'duo8' | 'duo12'
  
  // Session tracking
  totalSessions: number // 1, 4, 8, 12
  remainingSessions: number // decrements with each reservation
  sessionsBooked: string[] // array of reservation IDs
  sessionsAttended: string[] // array of reservation IDs where status=attended
  
  // Lifecycle
  purchaseDate: ISO string
  activationDate: ISO string | null
  expiryDate: ISO string | null // 6 months from activation
  
  // Status
  packageStatus: 'pending' | 'active' | 'fully_used' | 'expired' | 'cancelled'
  activationStatus: 'pending' | 'activated' | 'expired'
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid' | 'refunded'
  
  // Links
  firstReservationId: string // mandatory - first session reservation
  paymentId: string | null
  activationCodeId: string // references activation_code
  
  // Metadata
  name: string // user name at purchase
  surname: string
  mobile: string
  email: string
  language: string
  
  createdAt: ISO string
  updatedAt: ISO string
}
```

**KEY CONSTRAINT**: Every Package MUST have `firstReservationId` - cannot exist without initial reservation.

#### Reservation (NEW - Replaces "Booking")
```typescript
{
  id: string // "reservation:{timestamp}:{random}"
  userId: string // references user:email
  
  // Package link (null for standalone single sessions)
  packageId: string | null
  sessionNumber: number | null // 1-12, which session of package
  
  // Service type
  serviceType: 'single' | 'package' | 'individual' | 'duo'
  
  // Slot information (ALWAYS REQUIRED)
  dateKey: string // "1-23" format
  date: string // "23 January"
  fullDate: ISO string // "2026-01-23T08:00:00Z"
  timeSlot: string // "08:00"
  endTime: string // "08:50"
  instructor: string // "Rina Krasniqi"
  
  // Participant info
  name: string
  surname: string
  email: string
  mobile: string
  partnerName: string | null // for DUO only
  partnerSurname: string | null
  
  // Status tracking
  reservationStatus: 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'no_show' | 'expired'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  
  // Capacity
  seatsOccupied: number // 1 for single/individual, 2 for duo
  isPrivateSession: boolean // true for 1-on-1
  isOverbooked: boolean // admin override flag
  
  // Flags
  isFirstSessionOfPackage: boolean
  autoConfirmed: boolean // true if confirmed without activation (subsequent package sessions)
  lateCancellation: boolean // cancelled <24hr before
  
  // Cancellation
  cancelledAt: ISO string | null
  cancelledBy: 'user' | 'admin' | 'system' | null
  cancelReason: string | null
  
  // Timestamps
  createdAt: ISO string
  updatedAt: ISO string
  activatedAt: ISO string | null
  attendedAt: ISO string | null
  
  // Language for emails
  language: string
}
```

**KEY CONSTRAINT**: `dateKey`, `timeSlot`, `fullDate` are ALWAYS required. No reservation without concrete time.

#### ActivationCode
```typescript
{
  id: string // "activation_code:{CODE}"
  code: string // "WN-XXXX-XXXX"
  email: string
  
  // Link to either package OR reservation (for standalone single sessions)
  packageId: string | null
  reservationId: string | null // for standalone single sessions only
  
  status: 'active' | 'used' | 'expired'
  expiresAt: ISO string // 24 hours from creation
  usedAt: ISO string | null
  
  createdAt: ISO string
}
```

#### Payment (NEW)
```typescript
{
  id: string // "payment:{timestamp}:{random}"
  userId: string
  
  // Links
  packageId: string | null
  reservationIds: string[] // can pay for multiple reservations
  
  // Amount
  amount: number // in DEN
  amountPaid: number
  amountOutstanding: number
  currency: 'DEN'
  
  // Payment details
  paymentMethod: 'cash' | 'bank_transfer' | 'card'
  paymentDate: ISO string
  paymentReference: string | null
  
  // Status
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded'
  
  // Pre-payment token
  paymentToken: string | null // e.g. "ABC123"
  tokenUsed: boolean
  linkedAt: ISO string | null
  
  // Metadata
  notes: string | null
  createdBy: 'user' | 'admin'
  
  createdAt: ISO string
  updatedAt: ISO string
}
```

### 1.2 Entity Relationships

```
User (1) ──┬── (M) Package
           └── (M) Reservation

Package (1) ──┬── (M) Reservation (via sessionsBooked[])
              ├── (1) Reservation (via firstReservationId) [MANDATORY]
              ├── (1) ActivationCode
              └── (0-1) Payment

Reservation (M) ──┬── (0-1) Package (null for standalone single sessions)
                  ├── (1) User
                  └── (0-1) Payment

ActivationCode (1) ──┬── (0-1) Package
                     └── (0-1) Reservation (for standalone single only)

Payment (1) ──┬── (1) User
              ├── (0-1) Package
              └── (M) Reservation (via reservationIds[])
```

---

## 2. UPDATED API CONTRACTS

### 2.1 Package Endpoints

#### POST /make-server-b87b0c07/packages
**Purpose**: Create package purchase

**Request**:
```json
{
  "userId": "user@email.com",
  "packageType": "package8",
  "name": "John",
  "surname": "Doe",
  "mobile": "+389 70 123 456",
  "email": "user@email.com",
  "language": "en",
  "paymentToken": "ABC123" // optional pre-payment token
}
```

**Response**:
```json
{
  "success": true,
  "package": { /* Package object */ },
  "packageId": "package:user@email.com:1737800000000",
  "activationCode": "WN-XXXX-XXXX",
  "requiresFirstSessionBooking": true
}
```

**Business Logic**:
1. Validate userId exists
2. Validate packageType is valid
3. If paymentToken provided, validate and link
4. Create Package with status='pending', activationStatus='pending'
5. Set firstReservationId=null (will be set when first session booked)
6. Generate ActivationCode
7. Return packageId + activationCode
8. **DO NOT send email yet** - wait for first session booking

---

#### POST /make-server-b87b0c07/packages/:id/first-session
**Purpose**: Book first session for a package (MANDATORY step)

**Request**:
```json
{
  "dateKey": "1-25",
  "timeSlot": "09:00",
  "instructor": "Rina Krasniqi",
  "partnerName": "Jane", // required for duo only
  "partnerSurname": "Smith" // required for duo only
}
```

**Response**:
```json
{
  "success": true,
  "package": { /* Updated package with firstReservationId */ },
  "reservation": { /* Created reservation */ },
  "activationCode": "WN-XXXX-XXXX"
}
```

**Business Logic**:
1. Get package by ID
2. Validate package.packageStatus = 'pending' and firstReservationId is null
3. Validate slot availability based on serviceType
4. Create Reservation:
   - reservationStatus='pending'
   - isFirstSessionOfPackage=true
   - packageId=package.id
   - sessionNumber=1
5. Update Package:
   - firstReservationId=reservation.id
   - sessionsBooked=[reservation.id]
6. Send **COMBINED email** with activation code + first session details
7. Return both package and reservation

**CRITICAL**: This endpoint completes the package purchase flow. Frontend must call this before showing success.

---

#### GET /make-server-b87b0c07/packages?userId={email}
**Purpose**: Get all packages for a user

**Response**:
```json
{
  "success": true,
  "packages": [
    {
      "id": "package:user@email.com:timestamp",
      "packageType": "package8",
      "totalSessions": 8,
      "remainingSessions": 5,
      "packageStatus": "active",
      "paymentStatus": "unpaid",
      "expiryDate": "2026-07-25T00:00:00Z",
      /* ... */
    }
  ]
}
```

---

#### PATCH /make-server-b87b0c07/packages/:id/activate
**Purpose**: Activate package with activation code

**Request**:
```json
{
  "email": "user@email.com",
  "code": "WN-XXXX-XXXX"
}
```

**Response**:
```json
{
  "success": true,
  "package": { /* Activated package */ },
  "firstReservation": { /* Confirmed first reservation */ }
}
```

**Business Logic**:
1. Validate activation code exists, not used, not expired
2. Validate email matches
3. Get linked package
4. Get firstReservationId reservation
5. Update Package:
   - packageStatus='active'
   - activationStatus='activated'
   - activationDate=now
   - expiryDate=now + 6 months
   - remainingSessions=totalSessions - 1 (first session now booked)
6. Update first Reservation:
   - reservationStatus='confirmed'
   - activatedAt=now
7. Update ActivationCode:
   - status='used'
   - usedAt=now
8. Return both package and reservation

---

### 2.2 Reservation Endpoints

#### POST /make-server-b87b0c07/reservations
**Purpose**: Create a reservation (for single session OR subsequent package sessions)

**Request**:
```json
{
  "userId": "user@email.com",
  "packageId": "package:user@email.com:timestamp", // null for single session
  "serviceType": "single" | "package" | "individual" | "duo",
  "dateKey": "1-23",
  "timeSlot": "08:00",
  "instructor": "Rina Krasniqi",
  "name": "John",
  "surname": "Doe",
  "email": "user@email.com",
  "mobile": "+389 70 123 456",
  "partnerName": "Jane", // required for duo
  "partnerSurname": "Smith", // required for duo
  "language": "en"
}
```

**Response**:
```json
{
  "success": true,
  "reservation": { /* Reservation object */ },
  "reservationId": "reservation:timestamp:random",
  "requiresActivation": true, // true for single session, false for subsequent package sessions
  "activationCode": "WN-XXXX-XXXX" // only if requiresActivation=true
}
```

**Business Logic**:

**For Single Session (packageId=null)**:
1. Validate slot availability (capacity check)
2. Create Reservation with reservationStatus='pending'
3. Create ActivationCode linked to reservationId
4. Send activation email
5. Return reservation + activation code

**For Subsequent Package Session (packageId provided)**:
1. Validate package exists and belongs to userId
2. Validate package.packageStatus='active'
3. Validate package.remainingSessions > 0
4. Validate package not expired
5. Validate slot availability
6. Create Reservation:
   - reservationStatus='confirmed' (no activation needed)
   - autoConfirmed=true
   - sessionNumber=package.sessionsBooked.length + 1
7. Update Package:
   - remainingSessions--
   - sessionsBooked.push(reservation.id)
8. Return reservation (no activation code)

---

#### GET /make-server-b87b0c07/reservations
**Purpose**: Get all reservations (admin)

**Query Params**:
- `userId`: filter by user
- `dateKey`: filter by date
- `status`: filter by reservationStatus
- `paymentStatus`: filter by paymentStatus

**Response**:
```json
{
  "success": true,
  "reservations": [
    {
      "id": "reservation:timestamp:random",
      "userId": "user@email.com",
      "packageId": "package:user@email.com:timestamp",
      "serviceType": "package",
      "sessionNumber": 2,
      "dateKey": "1-25",
      "timeSlot": "09:00",
      "reservationStatus": "confirmed",
      "paymentStatus": "unpaid",
      "seatsOccupied": 1,
      "isPrivateSession": false,
      /* ... */
    }
  ]
}
```

---

#### PATCH /make-server-b87b0c07/reservations/:id/status
**Purpose**: Update reservation status (admin or user cancellation)

**Request**:
```json
{
  "status": "confirmed" | "attended" | "cancelled" | "no_show",
  "cancelledBy": "user" | "admin", // if status=cancelled
  "cancelReason": "User request" // optional
}
```

**Response**:
```json
{
  "success": true,
  "reservation": { /* Updated reservation */ },
  "packageUpdated": true, // if sessions were credited back
  "message": "Reservation cancelled and credit returned"
}
```

**Business Logic for Cancellation**:
1. Get reservation
2. Calculate hours until class
3. If >24hr OR cancelledBy='admin':
   - Set reservationStatus='cancelled'
   - If packageId: increment package.remainingSessions
   - Remove from package.sessionsBooked
   - Free slot capacity
4. If <24hr AND >2hr:
   - Set reservationStatus='cancelled'
   - Set lateCancellation=true
   - Do NOT auto-credit package
   - Flag for admin review
5. If <2hr:
   - Set reservationStatus='no_show'
   - Session consumed (no credit)
6. Save reservation
7. Send cancellation email

---

#### DELETE /make-server-b87b0c07/reservations/:id
**Purpose**: Delete reservation (admin only, for errors)

**Response**:
```json
{
  "success": true,
  "message": "Reservation deleted"
}
```

---

### 2.3 Activation Endpoint

#### POST /make-server-b87b0c07/activate
**Purpose**: Activate package or standalone reservation with code

**Request**:
```json
{
  "email": "user@email.com",
  "code": "WN-XXXX-XXXX"
}
```

**Response**:
```json
{
  "success": true,
  "type": "package" | "reservation",
  "package": { /* If type=package */ },
  "firstReservation": { /* If type=package */ },
  "reservation": { /* If type=reservation (single session) */ }
}
```

**Business Logic**:
1. Get activation code
2. Validate: exists, status='active', not expired, email matches

**If packageId exists (package activation)**:
3. Get package
4. Get firstReservationId
5. Activate both (see Package activate endpoint logic)
6. Return type='package' + package + firstReservation

**If reservationId exists (standalone single session)**:
3. Get reservation
4. Update reservation.reservationStatus='confirmed', activatedAt=now
5. Update code status='used'
6. Return type='reservation' + reservation

---

### 2.4 Payment Endpoints (NEW)

#### POST /make-server-b87b0c07/payments
**Purpose**: Create payment record (admin only)

**Request**:
```json
{
  "userId": "user@email.com",
  "packageId": "package:user@email.com:timestamp", // optional
  "reservationIds": ["reservation:xxx"], // optional
  "amount": 3800,
  "paymentMethod": "cash",
  "paymentToken": "ABC123", // optional - generate token for pre-payment
  "notes": "Paid in studio"
}
```

**Response**:
```json
{
  "success": true,
  "payment": { /* Payment object */ },
  "paymentToken": "ABC123" // if requested
}
```

---

#### PATCH /make-server-b87b0c07/payments/:id
**Purpose**: Update payment (link to package/reservations, mark paid)

**Request**:
```json
{
  "packageId": "package:user@email.com:timestamp",
  "amountPaid": 3800,
  "paymentStatus": "paid"
}
```

---

### 2.5 Utility Endpoints

#### POST /make-server-b87b0c07/migrate-bookings
**Purpose**: One-time migration of old bookings to new model

**Response**:
```json
{
  "success": true,
  "migrated": {
    "reservations": 45, // old bookings with date/time → reservations
    "orphanedPackages": 12, // old bookings without date/time → packages needing first session
    "activationCodes": 57
  }
}
```

**Migration Logic** (see section 3 below)

---

## 3. MIGRATION STRATEGY

### 3.1 Data Migration Logic

**OLD** structure:
```typescript
// booking:{id}
{
  id: string,
  email: string,
  name, surname, mobile,
  selectedPackage: 'package8' | '12classes' | etc,
  date: string | undefined,
  dateKey: string | undefined,
  timeSlot: string | undefined,
  status: 'pending' | 'confirmed',
  // ...
}
```

**Migration Rules**:

#### Rule 1: Booking WITH date/time → Reservation
```
IF booking.dateKey AND booking.timeSlot exist:
  CREATE Reservation {
    id: "reservation:" + booking.id
    userId: booking.email
    packageId: null // will link later if part of package
    serviceType: inferFromSelectedPackage(booking.selectedPackage)
    dateKey: booking.dateKey
    timeSlot: booking.timeSlot
    date: booking.date
    fullDate: constructFullDate(booking.dateKey, booking.timeSlot)
    instructor: booking.instructor || "Rina Krasniqi"
    name: booking.name
    surname: booking.surname
    email: booking.email
    mobile: booking.mobile
    reservationStatus: booking.status // map 'confirmed' → 'confirmed', 'pending' → 'pending'
    paymentStatus: 'unpaid'
    seatsOccupied: calculateSeats(serviceType)
    isPrivateSession: serviceType.includes('individual')
    isFirstSessionOfPackage: false // cannot determine from old data
    autoConfirmed: false
    language: booking.language || 'en'
    createdAt: booking.createdAt
    updatedAt: booking.updatedAt || booking.createdAt
  }
  
  STORE kv.set(reservation.id, reservation)
  ADD to user_reservations:{email} list
```

#### Rule 2: Booking WITHOUT date/time → Orphaned Package
```
IF booking.selectedPackage exists AND (NOT booking.dateKey OR NOT booking.timeSlot):
  CREATE Package {
    id: "package:" + booking.email + ":" + timestamp(booking.createdAt)
    userId: booking.email
    packageType: normalizePackageType(booking.selectedPackage)
    totalSessions: extractSessionCount(booking.selectedPackage)
    remainingSessions: totalSessions // full credit since no sessions booked yet
    sessionsBooked: []
    sessionsAttended: []
    purchaseDate: booking.createdAt
    activationDate: booking.activatedAt || null
    expiryDate: calculateExpiry(booking.activatedAt)
    packageStatus: determineStatus(booking.status, booking.activatedAt)
    activationStatus: booking.status === 'confirmed' ? 'activated' : 'pending'
    paymentStatus: 'unpaid'
    firstReservationId: null // ORPHANED - needs first session booking
    activationCodeId: findActivationCode(booking.id)
    name: booking.name
    surname: booking.surname
    mobile: booking.mobile
    email: booking.email
    language: booking.language || 'en'
    createdAt: booking.createdAt
    updatedAt: booking.updatedAt || booking.createdAt
  }
  
  STORE kv.set(package.id, package)
  ADD to user_packages:{email} list
  FLAG as orphaned: kv.set("orphaned_package:" + package.id, {userId: booking.email})
```

**Orphaned Package Handling**:
- On user login, check for orphaned packages
- If found, show modal: "You have an incomplete package purchase. Please book your first session to activate."
- Force user through first-session booking flow before accessing dashboard

#### Rule 3: Link Reservations to Packages
```
AFTER migrating all bookings:
  FOR each user:
    packages = get user's packages sorted by purchaseDate
    reservations = get user's reservations sorted by fullDate
    
    FOR each reservation WHERE packageId=null AND serviceType!='single':
      // Try to match to package
      matchingPackage = find package WHERE:
        - package.packageType matches reservation.serviceType
        - reservation.createdAt >= package.purchaseDate
        - package.sessionsBooked.length < package.totalSessions
      
      IF matchingPackage:
        reservation.packageId = matchingPackage.id
        reservation.sessionNumber = matchingPackage.sessionsBooked.length + 1
        matchingPackage.sessionsBooked.push(reservation.id)
        
        IF reservation.reservationStatus === 'attended':
          matchingPackage.sessionsAttended.push(reservation.id)
        
        IF matchingPackage.firstReservationId === null:
          matchingPackage.firstReservationId = reservation.id
          reservation.isFirstSessionOfPackage = true
        
        SAVE reservation
        SAVE matchingPackage
```

#### Rule 4: Activation Codes
```
FOR each activation_code:
  IF codeData.bookingId:
    oldBooking = kv.get(codeData.bookingId)
    
    IF oldBooking had date/time (now Reservation):
      newReservation = find reservation WHERE id includes oldBooking.id
      codeData.reservationId = newReservation.id
      codeData.packageId = null
    
    ELSE IF oldBooking had package but no date (now Package):
      newPackage = find package for this user/booking
      codeData.packageId = newPackage.id
      codeData.reservationId = null
    
    DELETE codeData.bookingId field
    SAVE codeData
```

### 3.2 Migration Endpoint Implementation

```typescript
app.post("/make-server-b87b0c07/migrate-bookings", async (c) => {
  console.log("Starting migration from bookings to packages + reservations...");
  
  const stats = {
    reservations: 0,
    orphanedPackages: 0,
    linkedReservations: 0,
    activationCodes: 0,
    errors: []
  };
  
  try {
    // Step 1: Get all old bookings
    const oldBookings = await kv.getByPrefix('booking:');
    console.log(`Found ${oldBookings.length} old bookings to migrate`);
    
    // Step 2: Migrate bookings with date/time → Reservations
    for (const booking of oldBookings) {
      if (booking.dateKey && booking.timeSlot) {
        // Has date/time → create Reservation
        const reservation = {
          id: `reservation:${booking.id.replace('booking:', '')}`,
          userId: booking.email,
          packageId: null, // will link later
          serviceType: inferServiceType(booking.selectedPackage),
          sessionNumber: null,
          dateKey: booking.dateKey,
          date: booking.date,
          fullDate: constructFullDate(booking.dateKey, booking.timeSlot),
          timeSlot: booking.timeSlot,
          endTime: calculateEndTime(booking.timeSlot),
          instructor: booking.instructor || 'Rina Krasniqi',
          name: booking.name,
          surname: booking.surname,
          email: booking.email,
          mobile: booking.mobile,
          partnerName: null,
          partnerSurname: null,
          reservationStatus: booking.status === 'confirmed' ? 'confirmed' : 'pending',
          paymentStatus: 'unpaid',
          seatsOccupied: booking.selectedPackage?.includes('duo') ? 2 : 1,
          isPrivateSession: booking.selectedPackage?.includes('individual') || false,
          isOverbooked: false,
          isFirstSessionOfPackage: false,
          autoConfirmed: false,
          lateCancellation: false,
          cancelledAt: null,
          cancelledBy: null,
          cancelReason: null,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt || booking.createdAt,
          activatedAt: booking.activatedAt || null,
          attendedAt: null,
          language: booking.language || 'en'
        };
        
        await kv.set(reservation.id, reservation);
        stats.reservations++;
      } 
      else if (booking.selectedPackage) {
        // Has package but NO date/time → create orphaned Package
        const totalSessions = extractSessionCount(booking.selectedPackage);
        const packageType = normalizePackageType(booking.selectedPackage);
        
        const pkg = {
          id: `package:${booking.email}:${Date.parse(booking.createdAt)}`,
          userId: booking.email,
          packageType,
          totalSessions,
          remainingSessions: totalSessions,
          sessionsBooked: [],
          sessionsAttended: [],
          purchaseDate: booking.createdAt,
          activationDate: booking.activatedAt || null,
          expiryDate: booking.activatedAt ? calculateExpiry(booking.activatedAt) : null,
          packageStatus: determinePackageStatus(booking),
          activationStatus: booking.status === 'confirmed' ? 'activated' : 'pending',
          paymentStatus: 'unpaid',
          firstReservationId: null, // ORPHANED
          paymentId: null,
          activationCodeId: null,
          name: booking.name,
          surname: booking.surname,
          mobile: booking.mobile,
          email: booking.email,
          language: booking.language || 'en',
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt || booking.createdAt
        };
        
        await kv.set(pkg.id, pkg);
        await kv.set(`orphaned_package:${pkg.id}`, {userId: booking.email});
        stats.orphanedPackages++;
      }
    }
    
    // Step 3: Link reservations to packages
    const allUsers = await kv.getByPrefix('user:');
    for (const user of allUsers) {
      const userPackages = await kv.getByPrefix(`package:${user.email}:`);
      const allReservations = await kv.getByPrefix('reservation:');
      const userReservations = allReservations.filter(r => r.userId === user.email);
      
      for (const reservation of userReservations) {
        if (!reservation.packageId && reservation.serviceType !== 'single') {
          // Try to link to package
          const matchingPackage = userPackages.find(pkg => 
            pkg.packageType.includes(reservation.serviceType) &&
            new Date(reservation.createdAt) >= new Date(pkg.purchaseDate) &&
            pkg.sessionsBooked.length < pkg.totalSessions
          );
          
          if (matchingPackage) {
            reservation.packageId = matchingPackage.id;
            reservation.sessionNumber = matchingPackage.sessionsBooked.length + 1;
            
            matchingPackage.sessionsBooked.push(reservation.id);
            
            if (!matchingPackage.firstReservationId) {
              matchingPackage.firstReservationId = reservation.id;
              reservation.isFirstSessionOfPackage = true;
              // Remove orphaned flag
              await kv.del(`orphaned_package:${matchingPackage.id}`);
            }
            
            await kv.set(reservation.id, reservation);
            await kv.set(matchingPackage.id, matchingPackage);
            stats.linkedReservations++;
          }
        }
      }
    }
    
    // Step 4: Migrate activation codes
    const allCodes = await kv.getByPrefix('activation_code:');
    for (const code of allCodes) {
      if (code.bookingId) {
        const booking = await kv.get(code.bookingId);
        
        if (booking) {
          if (booking.dateKey && booking.timeSlot) {
            // Was migrated to reservation
            code.reservationId = `reservation:${booking.id.replace('booking:', '')}`;
            code.packageId = null;
          } else if (booking.selectedPackage) {
            // Was migrated to package
            const pkgId = `package:${booking.email}:${Date.parse(booking.createdAt)}`;
            code.packageId = pkgId;
            code.reservationId = null;
          }
          
          delete code.bookingId;
          await kv.set(code.id, code);
          stats.activationCodes++;
        }
      }
    }
    
    console.log("Migration complete:", stats);
    return c.json({ success: true, migrated: stats });
    
  } catch (error) {
    console.error("Migration error:", error);
    stats.errors.push(error.message);
    return c.json({ success: false, stats, error: error.message }, 500);
  }
});

// Helper functions
function inferServiceType(selectedPackage) {
  if (!selectedPackage) return 'single';
  if (selectedPackage.includes('individual')) return 'individual';
  if (selectedPackage.includes('duo')) return 'duo';
  if (selectedPackage.includes('class') || selectedPackage.includes('package')) return 'package';
  return 'single';
}

function extractSessionCount(selectedPackage) {
  const match = selectedPackage.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function normalizePackageType(selectedPackage) {
  if (selectedPackage.includes('4')) return 'package4';
  if (selectedPackage.includes('8')) return 'package8';
  if (selectedPackage.includes('12')) return 'package12';
  if (selectedPackage.includes('individual') && selectedPackage.includes('1')) return 'individual1';
  if (selectedPackage.includes('individual') && selectedPackage.includes('8')) return 'individual8';
  if (selectedPackage.includes('individual') && selectedPackage.includes('12')) return 'individual12';
  if (selectedPackage.includes('duo') && selectedPackage.includes('1')) return 'duo1';
  if (selectedPackage.includes('duo') && selectedPackage.includes('8')) return 'duo8';
  if (selectedPackage.includes('duo') && selectedPackage.includes('12')) return 'duo12';
  return 'single';
}

function calculateExpiry(activationDate) {
  if (!activationDate) return null;
  const date = new Date(activationDate);
  date.setMonth(date.getMonth() + 6);
  return date.toISOString();
}

function determinePackageStatus(booking) {
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.activatedAt) return 'active';
  return 'pending';
}

function constructFullDate(dateKey, timeSlot) {
  const [month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const year = month === 1 ? 2026 : 2026; // Assuming 2026
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

function calculateEndTime(startTime) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 50;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}
```

---

## 4. UPDATED BOOKING FLOW DIAGRAMS

### 4.1 Single Session Flow

```
┌─────────────────────────────────────────────────┐
│ User Selects "SINGLE SESSION"                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Display Calendar + Time Slots                   │
│ (BookingScreen component)                       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Selects: Date + Time                       │
│ e.g., "Jan 23, 08:00"                           │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Fills Form:                                │
│ - Name, Surname, Mobile, Email                  │
│ - "Pay in Studio" (pre-checked, disabled)       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Clicks "CONFIRM BOOKING"                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: POST /reservations                    │
│ {                                               │
│   userId: email,                                │
│   packageId: null,                              │
│   serviceType: 'single',                        │
│   dateKey, timeSlot, name, surname, ...         │
│ }                                               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Backend:                                        │
│ 1. Validate slot availability                   │
│ 2. CREATE Reservation (status='pending')        │
│ 3. GENERATE ActivationCode                      │
│ 4. SEND email with code                         │
│ 5. RETURN {reservation, activationCode}         │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Show success                          │
│ "Check your email for activation code"          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User receives email → enters code               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: POST /activate                        │
│ {email, code}                                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Backend:                                        │
│ 1. Validate code                                │
│ 2. UPDATE Reservation status='confirmed'        │
│ 3. UPDATE ActivationCode status='used'          │
│ 4. RETURN {type:'reservation', reservation}     │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Show confirmation                     │
│ "✓ Booking confirmed!"                          │
│ Session: Jan 23, 08:00-08:50                    │
└─────────────────────────────────────────────────┘
```

### 4.2 Package Purchase + First Session Flow

```
┌─────────────────────────────────────────────────┐
│ User Selects "PACKAGE"                          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Display Package Options: 4 / 8 / 12 classes     │
│ (PackageOverview component)                     │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Selects: 8 CLASSES                         │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Fills Form:                                │
│ - Name, Surname, Mobile, Email                  │
│ - Optional: Payment Token (if prepaid)          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Clicks "CONFIRM BOOKING"                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: POST /packages                        │
│ {                                               │
│   userId: email,                                │
│   packageType: 'package8',                      │
│   name, surname, mobile, email                  │
│ }                                               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Backend:                                        │
│ 1. CREATE Package (status='pending')            │
│    firstReservationId=null                      │
│ 2. GENERATE ActivationCode → package            │
│ 3. DO NOT send email yet                        │
│ 4. RETURN {packageId, activationCode,           │
│             requiresFirstSessionBooking: true}  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Transition Screen (MANDATORY)         │
│ "✓ Package Registered!"                         │
│ "8-Class Package selected"                      │
│ "Now let's book your first session →"          │
│ [CONTINUE] button                               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Display Calendar + Time Slots                   │
│ (SAME component as single session)              │
│ Form PRE-FILLED with name/email                 │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Selects: Date + Time                       │
│ e.g., "Jan 25, 09:00"                           │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Clicks "CONFIRM FIRST SESSION"             │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: POST /packages/:id/first-session      │
│ {                                               │
│   dateKey, timeSlot, instructor                 │
│ }                                               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Backend:                                        │
│ 1. Validate slot availability                   │
│ 2. CREATE Reservation:                          │
│    - status='pending'                           │
│    - isFirstSessionOfPackage=true               │
│    - packageId=package.id                       │
│    - sessionNumber=1                            │
│ 3. UPDATE Package:                              │
│    - firstReservationId=reservation.id          │
│    - sessionsBooked=[reservation.id]            │
│ 4. SEND COMBINED EMAIL:                         │
│    - Activation code                            │
│    - Package details (8 classes)                │
│    - First session details (Jan 25, 09:00)      │
│ 5. RETURN {package, reservation, activationCode}│
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Show success                          │
│ "✓ Package & First Session Registered!"        │
│ "Check your email for activation code"          │
│ "Package: 8 Classes"                            │
│ "First Session: Jan 25, 09:00"                  │
│ "7 more sessions to book after activation"      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User receives email → enters code               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: POST /activate                        │
│ {email, code}                                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Backend:                                        │
│ 1. Validate code → packageId found              │
│ 2. UPDATE Package:                              │
│    - status='active'                            │
│    - activationStatus='activated'               │
│    - activationDate=now                         │
│    - expiryDate=now+6months                     │
│    - remainingSessions=7 (8-1)                  │
│ 3. UPDATE First Reservation:                    │
│    - status='confirmed'                         │
│    - activatedAt=now                            │
│ 4. UPDATE ActivationCode: status='used'         │
│ 5. RETURN {type:'package', package,             │
│             firstReservation}                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Redirect to User Dashboard            │
│ Show active package + next session countdown    │
└─────────────────────────────────────────────────┘
```

### 4.3 Subsequent Package Session Booking

```
┌─────────────────────────────────────────────────┐
│ User in Dashboard                               │
│ Active Package: 8 Classes (7 remaining)         │
│ [BOOK NEXT SESSION] button                      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Display Inline Calendar + Time Slots            │
│ (same component, integrated in dashboard)       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Selects: Date + Time                       │
│ e.g., "Jan 28, 10:00"                           │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ User Clicks "CONFIRM"                           │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: POST /reservations                    │
│ {                                               │
│   userId: email,                                │
│   packageId: 'package:user@email.com:xxx',      │
│   serviceType: 'package',                       │
│   dateKey, timeSlot, ...                        │
│ }                                               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Backend:                                        │
│ 1. Validate package active & has sessions       │
│ 2. Validate slot availability                   │
│ 3. CREATE Reservation:                          │
│    - status='confirmed' (auto-confirmed)        │
│    - autoConfirmed=true                         │
│    - packageId=package.id                       │
│    - sessionNumber=2                            │
│ 4. UPDATE Package:                              │
│    - remainingSessions=6 (7-1)                  │
│    - sessionsBooked.push(reservation.id)        │
│ 5. NO activation email needed                   │
│ 6. RETURN {reservation, requiresActivation:false}│
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Frontend: Instant confirmation                  │
│ "✓ Session Booked!"                             │
│ "Jan 28, 10:00-10:50"                           │
│ "Remaining sessions: 6"                         │
│ Dashboard auto-updates                          │
└─────────────────────────────────────────────────┘
```

---

## 5. RISK LIST

### 5.1 Migration Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Data loss during migration** | HIGH | 1. Take full KV store backup before migration<br>2. Run migration in staging first<br>3. Implement rollback procedure<br>4. Log all transformations |
| **Orphaned packages not handled** | MEDIUM | 1. Create dedicated admin view for orphaned packages<br>2. Email users with orphaned packages<br>3. Force first-session booking on login |
| **Reservation-Package link mismatch** | MEDIUM | 1. Implement validation script post-migration<br>2. Admin tool to manually link mismatched records |
| **Activation codes broken after migration** | HIGH | 1. Test all activation code scenarios<br>2. Implement code regeneration endpoint<br>3. Manual admin override capability |
| **User sessions count mismatch** | LOW | 1. Recalculate all package.remainingSessions from sessionsBooked<br>2. Admin tool to manually adjust |

### 5.2 Implementation Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Frontend still using old /bookings endpoint** | HIGH | 1. Implement adapter layer that redirects old calls<br>2. Gradual deprecation with warnings<br>3. Version API endpoints |
| **Capacity calculation errors** | MEDIUM | 1. Unit tests for all capacity logic<br>2. Admin override for edge cases<br>3. Real-time monitoring dashboard |
| **Package activation without first session** | CRITICAL | 1. API-level validation: cannot activate if firstReservationId=null<br>2. Frontend: disable activation modal until first session booked<br>3. Database constraint check |
| **DUO/1-on-1 seat logic incorrect** | MEDIUM | 1. Dedicated tests for special service types<br>2. Visual indicators in UI<br>3. Admin alerts for anomalies |
| **Time zone issues with fullDate** | LOW | 1. Always use Europe/Skopje timezone<br>2. Store ISO strings consistently<br>3. Test date handling across components |

### 5.3 User Experience Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Users confused by forced first-session booking** | MEDIUM | 1. Clear UI copy explaining flow<br>2. Progress indicator showing steps<br>3. Allow "save and continue later" for edge cases |
| **Package purchase feels longer** | LOW | 1. Optimize UI transitions<br>2. Show progress bar<br>3. Pre-load calendar data<br>4. Allow quick date selection |
| **Orphaned package users blocked** | MEDIUM | 1. Friendly modal explaining situation<br>2. Easy first-session booking flow<br>3. Admin support contact |
| **Activation email contains too much info** | LOW | 1. Clear formatting<br>2. Separate sections for package vs session<br>3. Mobile-optimized layout |

### 5.4 Backend Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **KV store performance degradation** | LOW | 1. Monitor query performance<br>2. Implement caching layer<br>3. Optimize prefix queries |
| **Transaction inconsistency (Package + Reservation)** | MEDIUM | 1. Implement transaction-like pattern with rollback<br>2. Validate both entities created<br>3. Cleanup job for incomplete records |
| **Email sending failures** | MEDIUM | 1. Retry logic for Resend API<br>2. Queue system for emails<br>3. Admin view of failed emails<br>4. Manual resend capability |
| **Activation code collisions** | LOW | 1. Check for existing code before generating<br>2. Increase code complexity<br>3. Log all generation attempts |

### 5.5 Admin Panel Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Cannot distinguish package sessions from single** | LOW | 1. Clear "Source" column showing package link<br>2. Visual badges (single/package/duo/1-on-1)<br>3. Filterable views |
| **Payment tracking complex with packages** | MEDIUM | 1. Separate payment tracking UI<br>2. Package-level payment status<br>3. Per-session payment if needed |
| **Cancellation logic errors** | MEDIUM | 1. Confirmation dialogs<br>2. Undo capability<br>3. Audit log of all admin actions |

---

## 6. SUCCESS CRITERIA VALIDATION

After refactor, the following MUST be true:

### 6.1 Data Integrity
- [ ] Zero reservations exist with null dateKey or timeSlot
- [ ] Zero packages exist with null firstReservationId (except orphaned ones flagged for user action)
- [ ] All package.sessionsBooked[] reference valid reservations
- [ ] All reservation.packageId reference valid packages (or null for single sessions)
- [ ] All activationCodes link to either packageId OR reservationId, never both

### 6.2 Flow Validation
- [ ] Single session booking creates 1 reservation + 1 activation code
- [ ] Package purchase creates 1 package (pending) + 0 reservations initially
- [ ] First-session booking creates 1 reservation + links to package + sends email
- [ ] Package activation activates both package AND first reservation
- [ ] Subsequent session booking creates auto-confirmed reservation
- [ ] Cancellation properly updates package.remainingSessions

### 6.3 Capacity Validation
- [ ] Group class slots correctly count confirmed reservations
- [ ] DUO bookings occupy 2 seats
- [ ] 1-on-1 bookings block entire slot
- [ ] Pending reservations do NOT count toward capacity
- [ ] Admin can see real-time availability

### 6.4 Admin Visibility
- [ ] All reservations show source (single/package/duo/1-on-1)
- [ ] Package sessions show "Session X of Y"
- [ ] Payment status visible per reservation
- [ ] Can filter by unpaid
- [ ] Can mark attended/paid

### 6.5 User Experience
- [ ] Cannot complete package purchase without booking first session
- [ ] Users with orphaned packages prompted on login
- [ ] Dashboard shows remaining sessions accurately
- [ ] Subsequent bookings instant (no activation needed)
- [ ] Cancellation rules enforced (24hr/2hr thresholds)

---

## APPENDIX A: API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/packages` | POST | Create package |
| `/packages/:id/first-session` | POST | Book mandatory first session |
| `/packages/:id/activate` | PATCH | Activate package with code |
| `/packages?userId={email}` | GET | Get user's packages |
| `/reservations` | POST | Create reservation (single or subsequent package) |
| `/reservations` | GET | Get all reservations (admin) |
| `/reservations/:id/status` | PATCH | Update reservation status |
| `/reservations/:id` | DELETE | Delete reservation |
| `/activate` | POST | Activate package or reservation with code |
| `/payments` | POST | Create payment (admin) |
| `/payments/:id` | PATCH | Update payment |
| `/migrate-bookings` | POST | One-time migration from old bookings |

---

## APPENDIX B: Frontend Component Changes Required

| Component | Change Required |
|-----------|----------------|
| `PackageOverview.tsx` | Split into 2 steps: 1) Package selection + form, 2) First session booking |
| `IndividualTraining.tsx` | Split into 2 steps: 1) Package selection + form, 2) First session booking |
| `DuoTraining.tsx` | Split into 2 steps: 1) Package selection + form, 2) First session booking |
| `BookingScreen.tsx` | Reuse for first-session booking, update API calls to `/packages/:id/first-session` |
| `UserDashboard.tsx` | Update to fetch packages from `/packages`, reservations from `/reservations` |
| `AdminPanel.tsx` | Update to use `/reservations` instead of `/bookings`, show package links |

---

## NEXT STEPS FOR IMPLEMENTATION

1. **Phase 1: Backend API** (Day 1-2)
   - Implement new entity models
   - Create `/packages` and `/reservations` endpoints
   - Implement activation logic
   - Unit tests

2. **Phase 2: Migration** (Day 3)
   - Implement migration endpoint
   - Test on staging data
   - Create rollback procedure
   - Document orphaned package handling

3. **Phase 3: Frontend - Package Flows** (Day 4-5)
   - Update PackageOverview to 2-step flow
   - Update IndividualTraining to 2-step flow
   - Update DuoTraining to 2-step flow
   - Integration tests

4. **Phase 4: Frontend - Dashboard** (Day 6)
   - Update UserDashboard to use new API
   - Implement orphaned package modal
   - Update subsequent booking flow
   - Test capacity calculations

5. **Phase 5: Admin Panel** (Day 7)
   - Update to use `/reservations`
   - Add package linking display
   - Payment tracking UI
   - Test all admin actions

6. **Phase 6: Testing & Deployment** (Day 8-9)
   - End-to-end tests all flows
   - Performance testing
   - Staging deployment
   - Production migration with backup

7. **Phase 7: Monitoring** (Day 10+)
   - Monitor for errors
   - User feedback collection
   - Fix edge cases
   - Documentation updates

---

END OF ARCHITECTURE REFACTOR PLAN
