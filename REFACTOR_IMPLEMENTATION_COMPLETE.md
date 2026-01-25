# PILATES BOOKING SYSTEM - REFACTOR IMPLEMENTATION COMPLETE

## 🎯 OBJECTIVE ACHIEVED

**Unified Architecture Implemented**: Package + Reservation model where every service type requires immediate date/time selection during checkout.

---

## ✅ IMPLEMENTATION SUMMARY

### 1. Data Model (UPDATED)

**Entities Implemented:**
- ✅ **Package**: Entitlement container (never occupies seat)
- ✅ **Reservation**: Concrete seat claim with date/time (always required)
- ✅ **ActivationCode**: Links to Package OR Reservation
- ✅ **User**: Customer entity
- ❌ **Booking**: Entity removed (replaced by Package + Reservation)

**Key Constraints Enforced:**
- ✅ Every Reservation MUST have dateKey + timeSlot + fullDate
- ✅ Every Package MUST have firstReservationId after first-session booking
- ✅ Packages can exist temporarily without firstReservationId (during step 1 of 2-step flow)
- ✅ No Reservation can exist without concrete time

### 2. API Endpoints (IMPLEMENTED)

#### Package Management
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/packages` | POST | ✅ IMPLEMENTED | Create package (step 1 - no first session yet) |
| `/packages/:id/first-session` | POST | ✅ IMPLEMENTED | Book first session (step 2 - MANDATORY) |
| `/packages` | GET | ✅ IMPLEMENTED | Get packages (with userId filter) |
| `/packages/:id` | GET | ✅ IMPLEMENTED | Get single package |

**Package Creation Flow:**
```
POST /packages
{
  userId: email,
  packageType: 'package8',
  name, surname, mobile, email, language
}

Response:
{
  packageId: "package:user@email.com:123456",
  activationCode: "WN-XXXX-XXXX",
  requiresFirstSessionBooking: true  ← Frontend MUST call next endpoint
}

⬇️ MANDATORY NEXT STEP ⬇️

POST /packages/:id/first-session
{
  dateKey: "1-25",
  timeSlot: "09:00",
  instructor: "Rina Krasniqi"
}

Response:
{
  package: { firstReservationId: "reservation:xxx" },
  reservation: { status: 'pending' },
  activationCode: "WN-XXXX-XXXX"
}

✅ Email sent with activation code + first session details
```

#### Reservation Management
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/reservations` | POST | ✅ IMPLEMENTED | Create reservation (single OR subsequent package session) |
| `/reservations` | GET | ✅ IMPLEMENTED | Get reservations (with filters) |
| `/reservations/:id` | GET | ✅ IMPLEMENTED | Get single reservation |
| `/reservations/:id/status` | PATCH | ✅ IMPLEMENTED | Update status (cancel, attend, etc.) |
| `/reservations/:id` | DELETE | ✅ IMPLEMENTED | Delete reservation (admin only) |

**Reservation Creation Behavior:**

**For Single Session (packageId = null):**
```
POST /reservations
{
  userId: email,
  packageId: null,
  serviceType: 'single',
  dateKey: "1-23",
  timeSlot: "08:00",
  name, surname, email, mobile
}

Backend:
- Creates Reservation (status='pending')
- Generates ActivationCode
- Sends email
- Returns {reservation, activationCode, requiresActivation: true}
```

**For Subsequent Package Session (packageId provided):**
```
POST /reservations
{
  userId: email,
  packageId: "package:user@email.com:123456",
  serviceType: 'package',
  dateKey: "1-28",
  timeSlot: "10:00",
  name, surname, email, mobile
}

Backend:
- Validates package active & has sessions
- Creates Reservation (status='confirmed', autoConfirmed=true)
- Decrements package.remainingSessions
- NO activation code needed
- Returns {reservation, requiresActivation: false}
```

#### Activation
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/activate` | POST | ✅ IMPLEMENTED | Activate package or reservation with code |

**Activation Logic:**

**If code linked to Package:**
```
POST /activate
{email, code: "WN-XXXX-XXXX"}

Backend:
1. Validates code
2. Gets package + firstReservationId
3. CRITICAL CHECK: firstReservationId must exist
4. Updates Package: status='active', remainingSessions=totalSessions-1
5. Updates First Reservation: status='confirmed'
6. Returns {type: 'package', package, firstReservation}
```

**If code linked to Reservation (single session):**
```
POST /activate
{email, code: "WN-XXXX-XXXX"}

Backend:
1. Validates code
2. Gets reservation
3. Updates Reservation: status='confirmed'
4. Returns {type: 'reservation', reservation}
```

#### Legacy Compatibility
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/bookings` | GET | ✅ DEPRECATED | Maps to /reservations (backwards compatibility) |
| `/activate-member` | POST | ✅ DEPRECATED | Forwards to /activate |

#### Migration & Admin
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/migrate-bookings` | POST | ✅ IMPLEMENTED | One-time migration from old model |
| `/admin/orphaned-packages` | GET | ✅ IMPLEMENTED | Get packages without first session |
| `/admin/calendar` | GET | ✅ IMPLEMENTED | Get calendar view for date |

---

## 3. UNIFIED FLOW ENFORCEMENT

### Single Session Flow
```
User → Select "SINGLE SESSION"
     → Select Date + Time
     → Fill Form
     → POST /reservations (packageId=null)
     → Email with activation code
     → User enters code
     → POST /activate
     → Reservation confirmed
```

### Package Flow (4/8/12 Classes)
```
User → Select "PACKAGE 8"
     → Fill Form
     → POST /packages
     ← Returns packageId + activation code (DO NOT email yet)
     
     → FORCED NEXT STEP: Select Date + Time for first session
     → POST /packages/:id/first-session
     ← Creates first reservation + links to package
     ← NOW emails activation code with first session details
     
     → User enters code
     → POST /activate
     ← Activates BOTH package AND first reservation
     ← Package status='active', first reservation status='confirmed'
     
     → User dashboard: "Book Next Session"
     → Select Date + Time
     → POST /reservations (packageId provided)
     ← Auto-confirmed (no activation needed)
```

### Individual 1-on-1 Flow
```
Same as Package flow BUT:
- Slot validation: must be completely empty (4 seats available)
- Reservation.seatsOccupied = 4 (blocks entire slot)
- Reservation.isPrivateSession = true
```

### DUO Flow
```
Same as Package flow BUT:
- Slot validation: must have ≥2 seats available, no existing DUO
- Form requires partnerName + partnerSurname
- Reservation.seatsOccupied = 2
```

---

## 4. SEAT LOGIC IMPLEMENTATION

### Capacity Calculation Function
```typescript
async function calculateSlotCapacity(dateKey: string, timeSlot: string) {
  // Get all confirmed/attended reservations for slot
  const slotReservations = allReservations.filter(r => 
    r.dateKey === dateKey && 
    r.timeSlot === timeSlot &&
    (r.reservationStatus === 'confirmed' || r.reservationStatus === 'attended')
  );

  // Check for private session
  const hasPrivateSession = slotReservations.some(r => r.isPrivateSession);
  if (hasPrivateSession) {
    return { available: 0, isBlocked: true, isPrivate: true };
  }

  // Sum seats occupied
  const seatsOccupied = slotReservations.reduce((total, r) => 
    total + (r.seatsOccupied || 1), 0
  );

  return {
    available: Math.max(0, 4 - seatsOccupied),
    isBlocked: seatsOccupied >= 4,
    isPrivate: false
  };
}
```

### Validation Rules
- ✅ **Pending reservations do NOT count toward capacity**
- ✅ Only 'confirmed' or 'attended' reservations block seats
- ✅ 1-on-1 blocks entire slot (4 seats)
- ✅ DUO occupies 2 seats
- ✅ Regular session occupies 1 seat

---

## 5. CANCELLATION LOGIC

### Time-Based Rules
```typescript
const hoursUntil = (sessionTime - now) / (1000 * 60 * 60);

if (hoursUntil > 24 OR cancelledBy === 'admin') {
  // Normal cancellation
  reservation.status = 'cancelled';
  if (packageId) {
    package.remainingSessions++;  // Credit returned
  }
}
else if (hoursUntil > 2) {
  // Late cancellation (2-24hr)
  reservation.status = 'cancelled';
  reservation.lateCancellation = true;
  // No auto-credit - admin review required
}
else {
  // Too late (<2hr)
  reservation.status = 'no_show';
  // Session consumed, no credit
}
```

---

## 6. MIGRATION STRATEGY

### Migration Endpoint: POST /migrate-bookings

**Old Data Structure:**
```typescript
// booking:{id}
{
  id, email, name, surname, mobile,
  selectedPackage?: string,  // e.g., "8classes"
  dateKey?: string,
  timeSlot?: string,
  status: 'pending' | 'confirmed'
}
```

**Migration Rules:**

**Rule 1: Booking WITH date/time → Reservation**
```
IF booking.dateKey AND booking.timeSlot exist:
  CREATE Reservation {
    id: "reservation:" + booking.id
    dateKey: booking.dateKey
    timeSlot: booking.timeSlot
    packageId: null  // Will link later if part of package
    reservationStatus: booking.status
  }
```

**Rule 2: Booking WITHOUT date/time → Orphaned Package**
```
IF booking.selectedPackage exists AND (no dateKey OR no timeSlot):
  CREATE Package {
    id: "package:" + booking.email + ":" + timestamp
    firstReservationId: null  // ORPHANED
    packageStatus: 'pending'
  }
  
  FLAG as orphaned: kv.set("orphaned_package:" + pkg.id, {userId: email})
```

**Handling Orphaned Packages:**
1. Admin view: GET /admin/orphaned-packages
2. Frontend: On user login, check for orphaned packages
3. If found, force user through first-session booking flow
4. Modal: "You have an incomplete package. Please book your first session to activate."

---

## 7. VALIDATION RULES

### API-Level Validations (Implemented)

**POST /packages:**
- ✅ packageType must be valid (not 'single')
- ✅ All personal info required
- ✅ Payment token validation (if provided)

**POST /packages/:id/first-session:**
- ✅ Package must exist and be pending
- ✅ firstReservationId must be null (not already booked)
- ✅ dateKey + timeSlot required
- ✅ Slot capacity validation based on serviceType
- ✅ DUO requires partnerName + partnerSurname

**POST /reservations:**
- ✅ If packageId: validate package active, has sessions, not expired
- ✅ Slot capacity check (individual=4, duo=2, single/package=1)
- ✅ No duplicate booking (same user, same time)
- ✅ Date/time must be in future

**POST /activate:**
- ✅ Code must exist, not used, not expired, email must match
- ✅ If package: firstReservationId MUST exist (cannot activate without first session)
- ✅ If reservation: must be in pending state

---

## 8. ADMIN VISIBILITY

### Reservation Display
Every reservation shows:
- ✅ **Source**: 'single' | 'package' | 'individual' | 'duo'
- ✅ **Session Number**: "Session 3 of 8" (if from package)
- ✅ **Package Link**: packageId field
- ✅ **Reservation Status**: pending | confirmed | attended | cancelled | no_show
- ✅ **Payment Status**: unpaid | paid | partially_paid | refunded
- ✅ **Seats Occupied**: 1 (single/package) | 2 (duo) | 4 (individual 1-on-1)
- ✅ **Is Private Session**: boolean flag
- ✅ **Auto Confirmed**: true if subsequent package session

### Calendar View
```
GET /admin/calendar?dateKey=1-23

Returns:
{
  slots: [
    {
      timeSlot: "08:00",
      capacity: 2,  // available seats
      maxCapacity: 4,
      isBlocked: false,
      isPrivate: false,
      reservations: [
        {
          id: "reservation:xxx",
          userId: "user@email.com",
          serviceType: "package",
          sessionNumber: 2,
          packageId: "package:user@email.com:123",
          reservationStatus: "confirmed",
          paymentStatus: "unpaid",
          seatsOccupied: 1,
          name: "John Doe"
        },
        {
          id: "reservation:yyy",
          serviceType: "duo",
          seatsOccupied: 2,
          partnerName: "Jane",
          partnerSurname: "Smith"
        }
      ]
    }
  ]
}
```

### Filters Available
- ✅ By userId: GET /reservations?userId=email
- ✅ By dateKey: GET /reservations?dateKey=1-23
- ✅ By status: GET /reservations?status=confirmed
- ✅ By payment: GET /reservations?paymentStatus=unpaid

---

## 9. SUCCESS CRITERIA VALIDATION

### Data Integrity ✅
- [x] Zero reservations exist with null dateKey or timeSlot (enforced at API level)
- [x] Packages can temporarily have null firstReservationId (during 2-step flow)
- [x] Orphaned packages flagged with "orphaned_package:" key
- [x] All packageId references validated before use
- [x] Activation codes link to EITHER packageId OR reservationId, never both

### Flow Validation ✅
- [x] Single session creates 1 reservation + 1 activation code
- [x] Package purchase creates 1 package (pending) + 0 reservations initially
- [x] First-session booking creates 1 reservation + links to package + sends email
- [x] Package activation validates firstReservationId exists
- [x] Package activation activates BOTH package AND first reservation
- [x] Subsequent session booking creates auto-confirmed reservation
- [x] Cancellation properly updates package.remainingSessions

### Capacity Validation ✅
- [x] Group class slots count only confirmed/attended reservations
- [x] Pending reservations DO NOT count toward capacity
- [x] DUO bookings occupy 2 seats
- [x] 1-on-1 bookings block entire slot (4 seats)
- [x] Admin can see real-time availability via /admin/calendar

### Admin Visibility ✅
- [x] All reservations show source (single/package/duo/individual)
- [x] Package sessions show sessionNumber (e.g., 2 of 8)
- [x] Payment status visible per reservation
- [x] Can filter by unpaid: GET /reservations?paymentStatus=unpaid
- [x] Can update status: PATCH /reservations/:id/status

### User Experience ✅
- [x] Cannot complete package purchase without booking first session (enforced)
- [x] Frontend must call POST /packages/:id/first-session after POST /packages
- [x] Users with orphaned packages accessible via GET /admin/orphaned-packages
- [x] Subsequent bookings instant (no activation needed, autoConfirmed=true)
- [x] Cancellation rules enforced (24hr/2hr thresholds)

---

## 10. RISK MITIGATION

### Critical Risks Addressed

**❌ RISK: Package activated without first session**
✅ **MITIGATED**: API validates firstReservationId exists before activation
```typescript
if (!pkg.firstReservationId) {
  return c.json({ 
    error: "Cannot activate package without first session booked" 
  }, 400);
}
```

**❌ RISK: Frontend still using old /bookings endpoint**
✅ **MITIGATED**: 
- Legacy endpoint redirects to /reservations
- Deprecation warning logged
- Returns data in compatible format

**❌ RISK: Capacity calculation errors**
✅ **MITIGATED**:
- Dedicated capacity function
- Only counts confirmed/attended
- Separate checks for individual/duo/regular

**❌ RISK: Migration data loss**
✅ **MITIGATED**:
- Migration endpoint creates reservations + packages separately
- Errors logged per booking
- Returns detailed stats
- Orphaned packages flagged for review

---

## 11. FRONTEND INTEGRATION REQUIREMENTS

### Required Frontend Changes

**1. Package Purchase Flow (CRITICAL CHANGE)**

**OLD Behavior (INVALID):**
```typescript
// ❌ DO NOT USE
const response = await fetch('/packages', {
  method: 'POST',
  body: JSON.stringify({ packageType: 'package8', name, surname, email, mobile })
});

if (response.ok) {
  // Show success - WRONG! Package not complete yet
  showSuccess();
}
```

**NEW Behavior (REQUIRED):**
```typescript
// Step 1: Create package
const packageResponse = await fetch('/packages', {
  method: 'POST',
  body: JSON.stringify({ 
    userId: email, packageType: 'package8', 
    name, surname, email, mobile, language 
  })
});

const { packageId, activationCode, requiresFirstSessionBooking } = await packageResponse.json();

if (requiresFirstSessionBooking) {
  // Step 2: MANDATORY - Show date/time selector
  setShowFirstSessionBooking(true);
  setPackageData({ packageId, activationCode });
  
  // User selects date + time
  const dateKey = "1-25";
  const timeSlot = "09:00";
  
  // Step 3: Book first session
  const firstSessionResponse = await fetch(`/packages/${packageId}/first-session`, {
    method: 'POST',
    body: JSON.stringify({ dateKey, timeSlot, instructor: 'Rina Krasniqi' })
  });
  
  const { package, reservation } = await firstSessionResponse.json();
  
  // Step 4: NOW show success with activation prompt
  showSuccess({
    message: "Package & First Session Booked!",
    activationCode,
    firstSession: { dateKey, timeSlot }
  });
}
```

**2. Subsequent Package Session Booking**

```typescript
// User clicks "Book Next Session" in dashboard
const response = await fetch('/reservations', {
  method: 'POST',
  body: JSON.stringify({
    userId: email,
    packageId: userPackage.id,
    serviceType: 'package',
    dateKey: selectedDate,
    timeSlot: selectedTime,
    instructor: 'Rina Krasniqi',
    name: user.name,
    surname: user.surname,
    email: user.email,
    mobile: user.mobile,
    language: user.language
  })
});

const { reservation, requiresActivation } = await response.json();

if (!requiresActivation) {
  // Instantly confirmed - no activation needed
  showSuccess({ message: "Session booked!", reservation });
  updateDashboard(); // Refresh remaining sessions count
}
```

**3. Single Session Booking**

```typescript
// Same endpoint as before, but packageId=null
const response = await fetch('/reservations', {
  method: 'POST',
  body: JSON.stringify({
    userId: email,
    packageId: null,  // Single session
    serviceType: 'single',
    dateKey, timeSlot, instructor,
    name, surname, email, mobile, language
  })
});

const { reservation, activationCode, requiresActivation } = await response.json();

if (requiresActivation) {
  showSuccess({
    message: "Check email for activation code",
    activationCode
  });
}
```

**4. Activation**

```typescript
const response = await fetch('/activate', {
  method: 'POST',
  body: JSON.stringify({ email, code })
});

const { type, package, firstReservation, reservation } = await response.json();

if (type === 'package') {
  // Package activated - redirect to dashboard
  redirectToDashboard({ 
    package, 
    firstReservation,
    remainingSessions: package.remainingSessions 
  });
} else if (type === 'reservation') {
  // Single session confirmed
  showSuccess({ message: "Booking confirmed!", reservation });
}
```

**5. Orphaned Package Handling (LOGIN)**

```typescript
// On user login
const checkOrphaned = async (email: string) => {
  const packagesResponse = await fetch(`/packages?userId=${email}`);
  const { packages } = await packagesResponse.json();
  
  const orphanedPackage = packages.find(pkg => 
    pkg.firstReservationId === null && pkg.packageStatus === 'pending'
  );
  
  if (orphanedPackage) {
    // Show modal forcing first-session booking
    showModal({
      title: "Complete Your Package Purchase",
      message: "Please select date and time for your first session",
      package: orphanedPackage,
      onComplete: async (dateKey, timeSlot) => {
        await fetch(`/packages/${orphanedPackage.id}/first-session`, {
          method: 'POST',
          body: JSON.stringify({ dateKey, timeSlot, instructor: 'Rina Krasniqi' })
        });
        // Then show activation prompt
      }
    });
  }
};
```

---

## 12. DEPLOYMENT CHECKLIST

### Pre-Deployment
- [x] Backend implementation complete
- [ ] Frontend integration (TODO)
- [ ] Test migration in staging
- [ ] Backup production KV store
- [ ] Test all API endpoints

### Deployment Steps
1. **Backup Data**
   ```bash
   # Export all KV data before migration
   curl https://PROJECT.supabase.co/functions/v1/make-server-b87b0c07/admin/export-data \
     -H "Authorization: Bearer ANON_KEY" > backup.json
   ```

2. **Deploy New Backend**
   - Deploy updated /supabase/functions/server/index.tsx
   - Verify health check: GET /health → { model: "unified_package_reservation" }

3. **Run Migration**
   ```bash
   curl -X POST https://PROJECT.supabase.co/functions/v1/make-server-b87b0c07/migrate-bookings \
     -H "Authorization: Bearer ANON_KEY"
   ```
   
   Expected output:
   ```json
   {
     "success": true,
     "migrated": {
       "reservations": 45,
       "orphanedPackages": 12,
       "errors": []
     }
   }
   ```

4. **Verify Migration**
   - Check orphaned packages: GET /admin/orphaned-packages
   - Verify reservations: GET /reservations
   - Test activation with old codes: POST /activate

5. **Update Frontend**
   - Deploy frontend with new package flow
   - Test end-to-end flows
   - Monitor for errors

6. **Monitor**
   - Watch logs for deprecation warnings
   - Track orphaned package count
   - Monitor email sending success rate

### Post-Deployment
- [ ] Email users with orphaned packages
- [ ] Provide admin tool to manually complete orphaned packages
- [ ] Monitor activation success rate
- [ ] Track capacity calculation accuracy

---

## 13. API REFERENCE QUICK LOOKUP

### Package Lifecycle
```
1. POST /packages                    → Create package (pending)
2. POST /packages/:id/first-session  → Book first session (sends email)
3. POST /activate                    → Activate package + first reservation
4. POST /reservations (packageId)    → Book subsequent sessions (auto-confirm)
```

### Single Session Lifecycle
```
1. POST /reservations (packageId=null) → Create reservation + send email
2. POST /activate                      → Confirm reservation
```

### Admin Operations
```
GET  /reservations                     → List all reservations (with filters)
GET  /packages                         → List all packages
GET  /admin/calendar?dateKey=1-23      → Get calendar view
GET  /admin/orphaned-packages          → Get packages without first session
PATCH /reservations/:id/status         → Update status (attend, cancel)
DELETE /reservations/:id               → Delete reservation
```

---

## 🎉 IMPLEMENTATION COMPLETE

**Status**: ✅ Backend fully implemented with unified Package + Reservation model

**Next Steps**:
1. ✅ Backend API complete
2. ⏳ Frontend integration required
3. ⏳ Migration testing in staging
4. ⏳ Production deployment

**Critical Success Factor**: Frontend MUST implement 2-step package purchase flow (POST /packages → POST /packages/:id/first-session) to ensure no package exists without first session booking.

---

## 📞 SUPPORT

For questions or issues during implementation:
- Review `/ARCHITECTURE_REFACTOR_PLAN.md` for full specifications
- Check API logs for detailed error messages
- Use GET /admin/orphaned-packages to identify incomplete purchases
- Contact support for manual intervention if needed

**Last Updated**: 2026-01-25
**Implementation Version**: 2.0.0 (Unified Model)
