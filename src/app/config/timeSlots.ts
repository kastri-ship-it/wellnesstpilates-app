// Single source of truth for time slots configuration
// Used by: BookingScreen, PackageOverview, AdminPanel

// Date-specific time slots (dateKey format: "month-day", e.g., "1-29")
export const DATE_SPECIFIC_SLOTS: Record<string, string[]> = {
  '1-29': ['18:15', '19:15', '20:15'],  // January 29: 50 min sessions
  '1-30': ['18:00', '19:00', '20:00'],  // January 30: 45 min sessions
};

// Date-specific session durations (in minutes)
export const DATE_SPECIFIC_DURATIONS: Record<string, number> = {
  '1-29': 50,  // January 29: 50 min sessions
  '1-30': 45,  // January 30: 45 min sessions
};

// Default time slots for all other dates
export const DEFAULT_TIME_SLOTS = ['09:00', '10:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

// Default session duration
export const DEFAULT_DURATION = 50;

// Get time slots for a specific date
export function getTimeSlotsForDate(dateKey: string): string[] {
  return DATE_SPECIFIC_SLOTS[dateKey] || DEFAULT_TIME_SLOTS;
}

// Get session duration for a specific date
export function getDurationForDate(dateKey: string): number {
  return DATE_SPECIFIC_DURATIONS[dateKey] || DEFAULT_DURATION;
}

// Calculate end time based on start time and date
export function calculateEndTime(startTime: string, dateKey: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const duration = getDurationForDate(dateKey);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}
