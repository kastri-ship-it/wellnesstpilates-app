import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b87b0c07/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ BOOKINGS ============

// Create a new booking
app.post("/make-server-b87b0c07/bookings", async (c) => {
  try {
    const body = await c.req.json();
    const { name, surname, mobile, email, date, dateKey, timeSlot, instructor, selectedPackage, payInStudio, language } = body;

    // Validate required fields
    if (!name || !surname || !mobile || !email) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Generate unique booking ID
    const bookingId = `booking:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // ALL bookings start as pending - user needs activation code to confirm
    const status = 'pending';

    const booking = {
      id: bookingId,
      name,
      surname,
      mobile,
      email,
      date,
      dateKey,
      timeSlot,
      instructor,
      selectedPackage: selectedPackage || null,
      payInStudio,
      language,
      status,
      createdAt: new Date().toISOString(),
    };

    // Store booking
    await kv.set(bookingId, booking);

    // Also store user email mapping for quick lookup
    const userBookingsKey = `user_bookings:${email}`;
    const existingBookings = await kv.get(userBookingsKey) || [];
    existingBookings.push(bookingId);
    await kv.set(userBookingsKey, existingBookings);

    console.log(`Booking created successfully: ${bookingId}`);
    return c.json({ success: true, booking, bookingId });
  } catch (error) {
    console.error('Error creating booking:', error);
    return c.json({ error: 'Failed to create booking', details: error.message }, 500);
  }
});

// Get all bookings (admin only)
app.get("/make-server-b87b0c07/bookings", async (c) => {
  try {
    // Get all bookings
    const bookingsData = await kv.getByPrefix('booking:');
    
    // Extract values from the key-value pairs
    const bookings = bookingsData.map(item => item.value || item);
    
    console.log(`Retrieved ${bookings.length} bookings`);
    return c.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return c.json({ error: 'Failed to fetch bookings', details: error.message }, 500);
  }
});

// Update booking status (admin only)
app.put("/make-server-b87b0c07/bookings/:id", async (c) => {
  try {
    const bookingId = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    // Get existing booking
    const booking = await kv.get(bookingId);
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    // Update status
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    await kv.set(bookingId, booking);

    console.log(`Booking ${bookingId} status updated to ${status}`);
    return c.json({ success: true, booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    return c.json({ error: 'Failed to update booking', details: error.message }, 500);
  }
});

// PATCH endpoint for status updates (shorter route)
app.patch("/make-server-b87b0c07/bookings/:id/status", async (c) => {
  try {
    const bookingId = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    // Get existing booking
    const booking = await kv.get(bookingId);
    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    // Update status
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    await kv.set(bookingId, booking);

    console.log(`Booking ${bookingId} status updated to ${status}`);
    return c.json({ success: true, booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return c.json({ error: 'Failed to update booking status', details: error.message }, 500);
  }
});

// Activate member with activation code
app.post("/make-server-b87b0c07/activate-member", async (c) => {
  try {
    const body = await c.req.json();
    const { email, code } = body;

    if (!email || !code) {
      return c.json({ error: "Missing email or activation code" }, 400);
    }

    const codeUpper = code.toUpperCase().trim();
    const codeKey = `activation_code:${codeUpper}`;
    
    // Check if activation code exists
    const codeData = await kv.get(codeKey);
    
    if (!codeData) {
      return c.json({ error: "Invalid activation code. Please check the code and try again." }, 400);
    }

    // Check if code has already been used
    if (codeData.status === 'used') {
      return c.json({ error: "This activation code has already been used and cannot be reused." }, 400);
    }

    // Check if code is expired
    if (new Date(codeData.expiresAt) < new Date()) {
      return c.json({ error: "This activation code has expired. Please contact support." }, 400);
    }

    // Verify the code belongs to this email
    if (codeData.email.toLowerCase() !== email.toLowerCase()) {
      return c.json({ error: "This activation code is not valid for this email address." }, 400);
    }

    // Get the booking associated with this code
    const booking = await kv.get(codeData.bookingId);
    
    if (!booking) {
      return c.json({ error: "Booking not found. Please contact support." }, 404);
    }

    // Check if booking is already confirmed
    if (booking.status === 'confirmed') {
      return c.json({ error: "This booking is already activated." }, 400);
    }

    // Update booking status to confirmed
    booking.status = 'confirmed';
    booking.activatedAt = new Date().toISOString();
    booking.activationCodeUsed = codeUpper;
    await kv.set(booking.id, booking);

    // Mark activation code as used
    codeData.status = 'used';
    codeData.usedAt = new Date().toISOString();
    await kv.set(codeKey, codeData);

    console.log(`Booking ${booking.id} activated for ${email} with code ${codeUpper}`);
    return c.json({ 
      success: true, 
      message: 'Member activated successfully!',
      booking: {
        id: booking.id,
        packageType: booking.selectedPackage,
        date: booking.date,
        timeSlot: booking.timeSlot,
        instructor: booking.instructor,
      }
    });
  } catch (error) {
    console.error('Error activating member:', error);
    return c.json({ error: 'Failed to activate member', details: error.message }, 500);
  }
});

// Delete booking (admin only)
app.delete("/make-server-b87b0c07/bookings/:id", async (c) => {
  try {
    const bookingId = c.req.param('id');
    
    // Get booking to find user email
    const booking = await kv.get(bookingId);
    if (booking) {
      // Remove from user bookings list
      const userBookingsKey = `user_bookings:${booking.email}`;
      const existingBookings = await kv.get(userBookingsKey) || [];
      const updatedBookings = existingBookings.filter(id => id !== bookingId);
      await kv.set(userBookingsKey, updatedBookings);
    }

    // Delete booking
    await kv.del(bookingId);

    console.log(`Booking ${bookingId} deleted successfully`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return c.json({ error: 'Failed to delete booking', details: error.message }, 500);
  }
});

// ============ USER MANAGEMENT ============

// Clear all test data (for development/testing)
app.post("/make-server-b87b0c07/dev/clear-all-data", async (c) => {
  try {
    console.log('Clearing all data...');
    
    // Get all keys with user: prefix
    const users = await kv.getByPrefix('user:');
    for (const user of users) {
      const key = `user:${user.email}`;
      await kv.del(key);
      console.log(`Deleted user: ${user.email}`);
    }
    
    // Get all keys with booking: prefix
    const bookings = await kv.getByPrefix('booking:');
    for (const booking of bookings) {
      await kv.del(booking.id);
      console.log(`Deleted booking: ${booking.id}`);
    }
    
    // Get all keys with user_bookings: prefix
    const userBookings = await kv.getByPrefix('user_bookings:');
    for (const ub of userBookings) {
      const key = `user_bookings:${ub.email || ub}`;
      await kv.del(key);
      console.log(`Deleted user bookings: ${key}`);
    }
    
    // Get all keys with code: prefix
    const codes = await kv.getByPrefix('code:');
    for (const code of codes) {
      await kv.del(code.code);
      console.log(`Deleted code: ${code.code}`);
    }
    
    console.log('All data cleared successfully');
    return c.json({ 
      success: true, 
      message: 'All data cleared successfully',
      cleared: {
        users: users.length,
        bookings: bookings.length,
        codes: codes.length
      }
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return c.json({ error: 'Failed to clear data', details: error.message }, 500);
  }
});

// Register user
app.post("/make-server-b87b0c07/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, surname, mobile } = body;

    console.log('Registration attempt for:', email);

    if (!email || !password || !name || !surname || !mobile) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const userKey = `user:${email}`;
    const existingUser = await kv.get(userKey);

    if (existingUser) {
      console.log('User already exists:', email);
      return c.json({ error: "User already exists" }, 409);
    }

    const newUser = {
      email,
      password,
      name,
      surname,
      mobile,
      package: null,
      sessionsRemaining: 0,
      createdAt: new Date().toISOString(),
    };

    await kv.set(userKey, newUser);
    
    console.log(`User registered successfully: ${email}`, newUser);
    return c.json({ 
      success: true, 
      message: "User registered successfully",
      user: {
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return c.json({ error: 'Failed to register user', details: error.message }, 500);
  }
});

// Login user
app.post("/make-server-b87b0c07/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Missing email or activation code" }, 400);
    }

    const codeUpper = password.toUpperCase().trim();
    
    // First, check if user exists in the system
    const userKey = `user:${email}`;
    let user = await kv.get(userKey);

    if (user) {
      // User exists, check their stored password/activation code
      if (user.password && user.password.toUpperCase().trim() === codeUpper) {
        console.log(`User logged in: ${email}`, { 
          package: user.package, 
          sessionsRemaining: user.sessionsRemaining 
        });
        
        return c.json({ 
          success: true, 
          user: { 
            email: user.email, 
            name: user.name, 
            surname: user.surname,
            mobile: user.mobile,
            package: user.package,
            sessionsRemaining: user.sessionsRemaining
          } 
        });
      } else {
        console.log(`Invalid activation code for existing user: ${email}`);
        return c.json({ error: "Invalid activation code. Please check your email and try again." }, 401);
      }
    }

    // If user doesn't exist, try to find them via booking with activation code
    console.log(`User not found in system, checking bookings for: ${email}`);
    const allBookings = await kv.getByPrefix('booking:');
    console.log(`Found ${allBookings.length} total bookings`);
    let userBooking = null;
    
    for (const booking of allBookings) {
      console.log(`Checking booking:`, { 
        email: booking?.email, 
        targetEmail: email,
        activationCode: booking?.activationCodeSent 
      });
      if (booking && booking.email === email) {
        userBooking = booking;
        console.log(`Found matching booking for ${email}:`, {
          bookingId: userBooking.id,
          status: userBooking.status,
          activationCode: userBooking.activationCodeSent,
          hasActivationCode: !!userBooking.activationCodeSent
        });
        break;
      }
    }

    if (!userBooking) {
      console.log(`No booking found for email: ${email}`);
      return c.json({ error: "User not found. Please register first or check your email for booking confirmation." }, 401);
    }

    // Check if the provided code matches the activation code sent
    if (!userBooking.activationCodeSent) {
      console.log(`No activation code found for user: ${email}`);
      return c.json({ error: "No activation code found. Please contact support or check your email." }, 401);
    }

    if (userBooking.activationCodeSent.toUpperCase().trim() !== codeUpper) {
      console.log(`Invalid activation code for booking. Expected: ${userBooking.activationCodeSent}, Got: ${codeUpper}`);
      return c.json({ error: "Invalid activation code. Please check your email and try again." }, 401);
    }

    // Create user from booking data
    user = {
      email,
      password: codeUpper, // Store the activation code as password
      name: userBooking.name,
      surname: userBooking.surname,
      mobile: userBooking.mobile,
      package: userBooking.selectedPackage,
      sessionsRemaining: userBooking.selectedPackage === 'package8' ? 8 : 
                        userBooking.selectedPackage === 'package10' ? 10 : 
                        userBooking.selectedPackage === 'package12' ? 12 :
                        userBooking.selectedPackage === '1class' ? 1 :
                        userBooking.selectedPackage === '8classes' ? 8 :
                        userBooking.selectedPackage === '12classes' ? 12 : 0,
      createdAt: new Date().toISOString(),
    };
    await kv.set(userKey, user);
    console.log(`User created from booking: ${email}`, user);

    console.log(`User logged in: ${email}`, { 
      package: user.package, 
      sessionsRemaining: user.sessionsRemaining 
    });
    
    return c.json({ 
      success: true, 
      user: { 
        email: user.email, 
        name: user.name, 
        surname: user.surname,
        mobile: user.mobile,
        package: user.package,
        sessionsRemaining: user.sessionsRemaining
      } 
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return c.json({ error: 'Failed to login', details: error.message }, 500);
  }
});

// Activate package with code
app.post("/make-server-b87b0c07/auth/activate", async (c) => {
  try {
    const body = await c.req.json();
    const { email, code } = body;

    if (!email || !code) {
      return c.json({ error: "Missing email or activation code" }, 400);
    }

    // Validate activation code and determine package
    const codeUpper = code.toUpperCase();
    let packageType = null;
    let sessions = 0;

    if (codeUpper === 'PILATES8') {
      packageType = 'package8';
      sessions = 8;
    } else if (codeUpper === 'PILATES12') {
      packageType = 'package12';
      sessions = 12;
    } else if (codeUpper === 'WELLNEST2025') {
      packageType = 'package10';
      sessions = 10;
    } else {
      return c.json({ error: "Invalid activation code" }, 400);
    }

    const userKey = `user:${email}`;
    const user = await kv.get(userKey);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update user with package info
    user.package = packageType;
    user.sessionsRemaining = (user.sessionsRemaining || 0) + sessions;
    await kv.set(userKey, user);

    console.log(`Package activated for ${email}: ${packageType}`);
    return c.json({ 
      success: true, 
      user: {
        email: user.email,
        name: user.name,
        surname: user.surname,
        package: user.package,
        sessionsRemaining: user.sessionsRemaining
      }
    });
  } catch (error) {
    console.error('Error activating package:', error);
    return c.json({ error: 'Failed to activate package', details: error.message }, 500);
  }
});

// Get user profile
app.get("/make-server-b87b0c07/user/profile", async (c) => {
  try {
    const email = c.req.query('email');
    
    if (!email) {
      return c.json({ error: "Missing email" }, 400);
    }

    const userKey = `user:${email}`;
    const user = await kv.get(userKey);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Don't send password to client
    const { password, ...userProfile } = user;

    return c.json({ success: true, user: userProfile });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return c.json({ error: 'Failed to get profile', details: error.message }, 500);
  }
});

// Update user profile
app.put("/make-server-b87b0c07/user/profile", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, surname, mobile, bio, profileImage } = body;

    if (!email) {
      return c.json({ error: "Missing email" }, 400);
    }

    const userKey = `user:${email}`;
    const user = await kv.get(userKey);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update user fields
    if (name) user.name = name;
    if (surname) user.surname = surname;
    if (mobile) user.mobile = mobile;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    user.updatedAt = new Date().toISOString();

    await kv.set(userKey, user);

    console.log(`Profile updated for ${email}`);
    
    const { password, ...userProfile } = user;
    return c.json({ success: true, user: userProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile', details: error.message }, 500);
  }
});

// Update user sessions (admin only)
app.patch("/make-server-b87b0c07/user/sessions", async (c) => {
  try {
    const body = await c.req.json();
    const { email, sessionsRemaining, packageType } = body;

    if (!email) {
      return c.json({ error: "Missing email" }, 400);
    }

    const userKey = `user:${email}`;
    const user = await kv.get(userKey);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update sessions
    if (sessionsRemaining !== undefined) user.sessionsRemaining = sessionsRemaining;
    if (packageType !== undefined) user.packageType = packageType;
    user.updatedAt = new Date().toISOString();

    await kv.set(userKey, user);

    console.log(`Sessions updated for ${email}: ${sessionsRemaining} sessions, package: ${packageType}`);
    
    const { password, ...userProfile } = user;
    return c.json({ success: true, user: userProfile });
  } catch (error) {
    console.error('Error updating sessions:', error);
    return c.json({ error: 'Failed to update sessions', details: error.message }, 500);
  }
});

// Get user bookings
app.get("/make-server-b87b0c07/user/bookings", async (c) => {
  try {
    const email = c.req.query('email');
    
    if (!email) {
      return c.json({ error: "Missing email" }, 400);
    }

    // Get all bookings for this user
    const allBookings = await kv.getByPrefix('booking:');
    const userBookings = allBookings
      .filter(booking => booking && booking.email === email)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ success: true, bookings: userBookings });
  } catch (error) {
    console.error('Error getting user bookings:', error);
    return c.json({ error: 'Failed to get bookings', details: error.message }, 500);
  }
});

// Get all users (admin only)
app.get("/make-server-b87b0c07/users", async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    
    // Remove passwords from response
    const sanitizedUsers = users.map(user => ({
      email: user.email,
      name: user.name,
      surname: user.surname,
      mobile: user.mobile,
      package: user.package,
      sessionsRemaining: user.sessionsRemaining,
      createdAt: user.createdAt,
      activatedAt: user.activatedAt
    }));

    console.log(`Retrieved ${sanitizedUsers.length} users`);
    return c.json({ success: true, users: sanitizedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users', details: error.message }, 500);
  }
});

// Delete a user (admin only)
app.delete("/make-server-b87b0c07/users/:email", async (c) => {
  try {
    const email = c.req.param('email');
    
    if (!email) {
      return c.json({ error: "Missing email" }, 400);
    }

    // Delete user
    const userKey = `user:${email}`;
    await kv.del(userKey);
    console.log(`Deleted user: ${email}`);

    // Delete user's bookings
    const userBookingsKey = `user_bookings:${email}`;
    await kv.del(userBookingsKey);
    console.log(`Deleted user bookings: ${email}`);

    // Delete all bookings associated with this email
    const allBookings = await kv.getByPrefix('booking:');
    for (const booking of allBookings) {
      if (booking && booking.email === email) {
        await kv.del(booking.id);
        console.log(`Deleted booking: ${booking.id}`);
      }
    }

    // Delete activation code if exists
    const allCodes = await kv.getByPrefix('activation_code:');
    for (const code of allCodes) {
      if (code && code.email === email) {
        await kv.del(`activation_code:${code.code}`);
        console.log(`Deleted activation code: ${code.code}`);
      }
    }

    return c.json({ success: true, message: `User ${email} deleted successfully` });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user', details: error.message }, 500);
  }
});

// Block/unblock a user (admin only)
app.patch("/make-server-b87b0c07/users/:email/block", async (c) => {
  try {
    const email = c.req.param('email');
    const body = await c.req.json();
    const { blocked } = body;

    if (!email) {
      return c.json({ error: "Missing email" }, 400);
    }

    // Get user
    const userKey = `user:${email}`;
    const user = await kv.get(userKey);

    if (!user) {
      // User might not exist yet, block all their bookings
      const allBookings = await kv.getByPrefix('booking:');
      let updated = false;
      for (const booking of allBookings) {
        if (booking && booking.email === email) {
          booking.blocked = blocked;
          await kv.set(booking.id, booking);
          console.log(`${blocked ? 'Blocked' : 'Unblocked'} booking: ${booking.id}`);
          updated = true;
        }
      }
      
      if (!updated) {
        return c.json({ error: "User not found" }, 404);
      }
    } else {
      // Update user block status
      user.blocked = blocked;
      await kv.set(userKey, user);
      console.log(`${blocked ? 'Blocked' : 'Unblocked'} user: ${email}`);

      // Also update all their bookings
      const allBookings = await kv.getByPrefix('booking:');
      for (const booking of allBookings) {
        if (booking && booking.email === email) {
          booking.blocked = blocked;
          await kv.set(booking.id, booking);
        }
      }
    }

    return c.json({ success: true, message: `User ${email} ${blocked ? 'blocked' : 'unblocked'} successfully`, blocked });
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    return c.json({ error: 'Failed to update user block status', details: error.message }, 500);
  }
});

// Gift sessions to a user (admin only)
app.post("/make-server-b87b0c07/users/:email/gift", async (c) => {
  try {
    const email = c.req.param('email');
    const body = await c.req.json();
    const { sessions, note } = body;

    if (!email || !sessions) {
      return c.json({ error: "Missing email or sessions" }, 400);
    }

    // Get user
    const userKey = `user:${email}`;
    const user = await kv.get(userKey);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Add gifted sessions
    const currentSessions = user.sessionsRemaining || 0;
    user.sessionsRemaining = currentSessions + sessions;
    user.giftedSessions = (user.giftedSessions || 0) + sessions;
    user.giftHistory = user.giftHistory || [];
    user.giftHistory.push({
      sessions,
      note: note || 'Admin gift',
      giftedAt: new Date().toISOString(),
    });

    await kv.set(userKey, user);
    console.log(`Gifted ${sessions} sessions to user: ${email}`);

    return c.json({ 
      success: true, 
      message: `Gifted ${sessions} sessions to ${email}`,
      newTotal: user.sessionsRemaining,
    });
  } catch (error) {
    console.error('Error gifting sessions:', error);
    return c.json({ error: 'Failed to gift sessions', details: error.message }, 500);
  }
});

// ============ EMAIL SENDING ============

// Helper function to generate random activation code
function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = 'WN-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3) code += '-'; // Format: WN-XXXX-XXXX
  }
  return code;
}

// Send activation code via email
app.post("/make-server-b87b0c07/send-activation-code", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, surname, bookingId, packageType } = body;

    if (!email || !name || !bookingId || !packageType) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Generate unique random activation code
    const activationCode = generateActivationCode();

    // Store activation code with booking reference
    const codeKey = `activation_code:${activationCode}`;
    const codeData = {
      code: activationCode,
      email,
      bookingId,
      packageType,
      status: 'unused',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    await kv.set(codeKey, codeData);

    // Also store code reference on the booking
    const booking = await kv.get(bookingId);
    if (booking) {
      booking.activationCodeSent = activationCode;
      booking.codeSentAt = new Date().toISOString();
      booking.status = 'confirmed'; // Update status to confirmed when code is sent
      await kv.set(bookingId, booking);
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return c.json({ error: 'Email service not configured' }, 500);
    }

    // Determine package info based on package type
    let packageInfo = '';
    let packageName = '';
    if (packageType === 'package8') {
      packageInfo = '8 Sessions Package - 3500 DEN';
      packageName = '8 Sessions';
    } else if (packageType === 'package12') {
      packageInfo = '12 Sessions Package - 4800 DEN';
      packageName = '12 Sessions';
    } else if (packageType === 'package10') {
      packageInfo = '10 Sessions Package - 4200 DEN (Recommended)';
      packageName = '10 Sessions';
    } else {
      packageInfo = 'Single Session - 600 DEN';
      packageName = 'Single Session';
    }

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wellnest Pilates <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Wellnest Pilates Activation Code',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f0ed;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f0ed; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background-color: #9ca571; padding: 40px 40px 30px 40px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Wellnest Pilates</h1>
                          <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Gjuro Gjakovikj 59, Kumanovo 1300</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <h2 style="margin: 0 0 20px 0; color: #3d2f28; font-size: 24px;">Welcome, ${name}${surname ? ' ' + surname : ''}! 🎉</h2>
                          
                          <p style="margin: 0 0 20px 0; color: #6b5949; font-size: 16px; line-height: 1.6;">
                            Thank you for choosing Wellnest Pilates! Your ${packageName} package is ready to be activated.
                          </p>
                          
                          <div style="background-color: #f5f0ed; border-radius: 12px; padding: 24px; margin: 30px 0;">
                            <p style="margin: 0 0 12px 0; color: #6b5949; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Activation Code</p>
                            <p style="margin: 0; color: #3d2f28; font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                              ${activationCode}
                            </p>
                          </div>
                          
                          <div style="background-color: #fff8f0; border-left: 4px solid #9ca571; padding: 16px; margin: 24px 0;">
                            <p style="margin: 0; color: #6b5949; font-size: 14px; line-height: 1.6;">
                              <strong style="color: #3d2f28;">Package Details:</strong><br>
                              ${packageInfo}
                            </p>
                          </div>
                          
                          <h3 style="margin: 30px 0 16px 0; color: #3d2f28; font-size: 18px;">How to Activate:</h3>
                          <ol style="margin: 0; padding-left: 20px; color: #6b5949; font-size: 15px; line-height: 1.8;">
                            <li>Open the Wellnest Pilates booking app</li>
                            <li>Click on "Member Login" or "Activate Member Area"</li>
                            <li>Enter your email and the activation code above</li>
                            <li>Start booking your sessions!</li>
                          </ol>
                          
                          <p style="margin: 30px 0 0 0; color: #6b5949; font-size: 14px; line-height: 1.6;">
                            If you have any questions, please don't hesitate to contact us.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f5f0ed; padding: 30px 40px; text-align: center; border-top: 1px solid #e8dfd8;">
                          <p style="margin: 0 0 8px 0; color: #8b7764; font-size: 13px;">
                            Wellnest Pilates Studio
                          </p>
                          <p style="margin: 0 0 8px 0; color: #8b7764; font-size: 12px;">
                            Gjuro Gjakovikj 59, Kumanovo 1300
                          </p>
                          <p style="margin: 0; color: #8b7764; font-size: 12px;">
                            © 2026 Wellnest Pilates. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData);
      return c.json({ error: 'Failed to send email', details: emailData }, 500);
    }

    console.log(`Activation code ${activationCode} sent to ${email}`);
    return c.json({ success: true, message: 'Email sent successfully', emailId: emailData.id });
  } catch (error) {
    console.error('Error sending activation code:', error);
    return c.json({ error: 'Failed to send email', details: error.message }, 500);
  }
});

// ============ MOCK DATA GENERATION ============

// Generate mock users and bookings for testing
app.post("/make-server-b87b0c07/dev/generate-mock-data", async (c) => {
  try {
    console.log('Generating mock data...');

    // Albanian, Macedonian, and English names
    const firstNames = [
      'Arjeta', 'Besarta', 'Donjeta', 'Erëza', 'Flutura', 'Gresa', 'Hana', 'Iliriana', 'Jetmira', 'Kaltrina',
      'Elena', 'Marija', 'Jovana', 'Kristina', 'Ana', 'Stefanija', 'Natasha', 'Darija', 'Ivana', 'Tijana',
      'Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail',
      'Luan', 'Arben', 'Bekim', 'Dardan', 'Enis', 'Fisnik', 'Granit', 'Hekuran', 'Ilir', 'Jeton',
      'Stefan', 'Marko', 'Nikola', 'Aleksandar', 'Dejan', 'Igor', 'Viktor', 'Petar', 'Dimitar', 'Bojan'
    ];

    const lastNames = [
      'Hoxha', 'Krasniqi', 'Kastrati', 'Berisha', 'Shala', 'Morina', 'Gashi', 'Kelmendi', 'Rama', 'Shehu',
      'Petrov', 'Stojanovski', 'Dimitrovski', 'Nikolovski', 'Georgievski', 'Trajkovski', 'Ivanov', 'Kostovski', 'Jovanovski', 'Angelovski',
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'
    ];

    const instructors = ['Instructor 1', 'Instructor 2', 'Instructor 3'];
    const packages = [
      { type: 'package8', sessions: 8 },
      { type: 'package10', sessions: 10 },
      { type: 'package12', sessions: 12 },
      { type: '1class', sessions: 1 }
    ];

    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '16:00', '17:00', '18:00'];
    
    // Generate dates from January 23rd to February 28th, 2026 (weekdays only)
    const getWeekdaysInRange = () => {
      const dates = [];
      // Start: January 23, 2026
      const startDate = new Date(2026, 0, 23); // Month is 0-indexed (0 = January)
      // End: February 28, 2026 (end of February)
      const endDate = new Date(2026, 1, 28); // Month 1 = February
      
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        // Only include weekdays (Monday = 1 to Friday = 5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          dates.push({
            date: new Date(currentDate),
            dateKey: `${currentDate.getMonth() + 1}-${currentDate.getDate()}`
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    const dates = getWeekdaysInRange();
    console.log(`Generated ${dates.length} weekdays between Jan 23 and Feb 28, 2026`);

    // Generate 100 mock users (increased for better coverage across all days)
    const mockUsers = [];
    const mockBookings = [];

    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const mobile = `070${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Random package
      const packageData = packages[Math.floor(Math.random() * packages.length)];
      
      // Generate activation code
      const activationCode = generateActivationCode();
      
      // Create user with registration date before Jan 23, 2026
      const registrationDate = new Date(2026, 0, Math.floor(Math.random() * 22) + 1); // Jan 1-22, 2026
      
      // Create user
      const user = {
        email,
        password: activationCode,
        name: firstName,
        surname: lastName,
        mobile,
        package: packageData.type,
        sessionsRemaining: Math.floor(Math.random() * packageData.sessions) + 1,
        createdAt: registrationDate.toISOString(),
      };
      
      await kv.set(`user:${email}`, user);
      mockUsers.push(user);
      
      // Create 2-4 bookings for each user (increased to cover all days)
      const numBookings = Math.floor(Math.random() * 3) + 2;
      
      for (let b = 0; b < numBookings; b++) {
        const randomDate = dates[Math.floor(Math.random() * dates.length)];
        const randomTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const randomInstructor = instructors[Math.floor(Math.random() * instructors.length)];
        
        // 70% confirmed, 30% pending
        const status = Math.random() > 0.3 ? 'confirmed' : 'pending';
        
        const bookingId = `booking:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Booking created 1-3 days before the actual booking date
        const bookingCreatedDate = new Date(randomDate.date);
        bookingCreatedDate.setDate(bookingCreatedDate.getDate() - Math.floor(Math.random() * 3) - 1);
        
        const booking = {
          id: bookingId,
          name: firstName,
          surname: lastName,
          mobile,
          email,
          date: randomDate.date.toISOString(),
          dateKey: randomDate.dateKey,
          timeSlot: randomTime,
          instructor: randomInstructor,
          selectedPackage: packageData.type,
          payInStudio: Math.random() > 0.5,
          language: ['sq', 'mk', 'en'][Math.floor(Math.random() * 3)],
          status,
          activationCodeSent: activationCode,
          codeSentAt: bookingCreatedDate.toISOString(),
          createdAt: bookingCreatedDate.toISOString(),
        };
        
        await kv.set(bookingId, booking);
        mockBookings.push(booking);
        
        // Store activation code
        const codeKey = `activation_code:${activationCode}`;
        const codeData = {
          code: activationCode,
          email,
          bookingId,
          status: status === 'confirmed' ? 'used' : 'unused',
          createdAt: booking.createdAt,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usedAt: status === 'confirmed' ? new Date().toISOString() : null,
        };
        await kv.set(codeKey, codeData);
        
        // Add to user bookings list
        const userBookingsKey = `user_bookings:${email}`;
        const existingBookings = await kv.get(userBookingsKey) || [];
        existingBookings.push(bookingId);
        await kv.set(userBookingsKey, existingBookings);
      }
    }

    console.log(`Generated ${mockUsers.length} users and ${mockBookings.length} bookings`);
    
    return c.json({
      success: true,
      message: 'Mock data generated successfully',
      stats: {
        users: mockUsers.length,
        bookings: mockBookings.length,
        dateRange: 'January 23 - February 10, 2026',
        weekdays: dates.length,
      }
    });
  } catch (error) {
    console.error('Error generating mock data:', error);
    return c.json({ error: 'Failed to generate mock data', details: error.message }, 500);
  }
});

Deno.serve(app.fetch);