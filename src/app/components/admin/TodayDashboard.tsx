import { useState, useEffect } from 'react';
import { Clock, Users, DollarSign, TrendingUp, ChevronRight, Calendar } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getTimeSlotsForDate, calculateEndTime } from '../../config/timeSlots';

type TodayDashboardProps = {
  onNavigate: (tab: 'today' | 'classes' | 'users' | 'schedule' | 'waitlist') => void;
};

type ClassSlot = {
  time: string;
  endTime: string;
  booked: number;
  capacity: number;
  participants: Array<{
    name: string;
    status: string;
    paymentStatus: string;
  }>;
};

type DashboardMetrics = {
  totalBookings: number;
  attendanceRate: number;
  paidCount: number;
  pendingCount: number;
  revenue: number;
};

export function TodayDashboard({ onNavigate }: TodayDashboardProps) {
  const [nextClass, setNextClass] = useState<ClassSlot | null>(null);
  const [minutesToNextClass, setMinutesToNextClass] = useState<number | null>(null);
  const [todayClasses, setTodayClasses] = useState<ClassSlot[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalBookings: 0,
    attendanceRate: 0,
    paidCount: 0,
    pendingCount: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const getTodayDateKey = () => {
    const today = new Date();
    return `${today.getMonth() + 1}-${today.getDate()}`;
  };

  useEffect(() => {
    fetchTodayData();
    const interval = setInterval(updateCountdown, 60000); // Update countdown every minute
    return () => clearInterval(interval);
  }, []);

  const fetchTodayData = async () => {
    try {
      setIsLoading(true);
      const dateKey = getTodayDateKey();

      // Fetch bookings
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/bookings`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      const data = await response.json();
      const allBookings = data.bookings || [];

      // Filter for today
      const todayBookings = allBookings.filter((b: any) => b.dateKey === dateKey);

      // Get time slots for today
      const timeSlots = getTimeSlotsForDate(dateKey);

      // Build class slots
      const slots: ClassSlot[] = timeSlots.map(time => {
        const slotBookings = todayBookings.filter((b: any) => b.timeSlot === time);
        return {
          time,
          endTime: calculateEndTime(time, dateKey),
          booked: slotBookings.length,
          capacity: 4,
          participants: slotBookings.map((b: any) => ({
            name: `${b.name} ${b.surname}`,
            status: b.reservationStatus || b.status,
            paymentStatus: b.paymentStatus,
          })),
        };
      });

      setTodayClasses(slots);

      // Calculate metrics
      const paidCount = todayBookings.filter((b: any) =>
        b.paymentStatus === 'paid' || b.reservationStatus === 'confirmed'
      ).length;
      const attendedCount = todayBookings.filter((b: any) =>
        b.reservationStatus === 'attended' || b.reservationStatus === 'confirmed'
      ).length;

      setMetrics({
        totalBookings: todayBookings.length,
        attendanceRate: todayBookings.length > 0
          ? Math.round((attendedCount / todayBookings.length) * 100)
          : 0,
        paidCount,
        pendingCount: todayBookings.length - paidCount,
        revenue: paidCount * 500, // Approximate
      });

      // Find next class
      updateCountdown(slots);

    } catch (error) {
      console.error('Error fetching today data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCountdown = (slots?: ClassSlot[]) => {
    const classSlots = slots || todayClasses;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const slot of classSlots) {
      const [hours, mins] = slot.time.split(':').map(Number);
      const slotMinutes = hours * 60 + mins;

      if (slotMinutes > currentMinutes) {
        setNextClass(slot);
        setMinutesToNextClass(slotMinutes - currentMinutes);
        return;
      }
    }

    // No more classes today
    setNextClass(null);
    setMinutesToNextClass(null);
  };

  const formatCountdown = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCapacityColor = (booked: number, capacity: number) => {
    const ratio = booked / capacity;
    if (ratio >= 1) return 'bg-green-500';
    if (ratio >= 0.75) return 'bg-lime-500';
    if (ratio >= 0.5) return 'bg-yellow-500';
    if (ratio >= 0.25) return 'bg-orange-500';
    return 'bg-red-400';
  };

  const getCapacityDots = (booked: number, capacity: number) => {
    return Array.from({ length: capacity }, (_, i) => (
      <span
        key={i}
        className={`w-2 h-2 rounded-full ${
          i < booked ? getCapacityColor(booked, capacity) : 'bg-gray-200'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#6b5949] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Next Class Countdown */}
      {nextClass && minutesToNextClass !== null ? (
        <button
          onClick={() => onNavigate('classes')}
          className="w-full bg-gradient-to-r from-[#6b5949] to-[#8b7764] rounded-xl p-4 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Next class in</p>
              <p className="text-2xl font-bold">{formatCountdown(minutesToNextClass)}</p>
              <p className="text-sm mt-1">
                {nextClass.time} - {nextClass.endTime} ({nextClass.booked}/{nextClass.capacity} booked)
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </button>
      ) : (
        <div className="bg-[#f5f0ed] rounded-xl p-4 border border-[#e8dfd8]">
          <div className="flex items-center gap-3 text-[#8b7764]">
            <Clock className="w-6 h-6" />
            <p>No more classes scheduled for today</p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e8dfd8]">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#6b5949]" />
            <span className="text-xs text-[#8b7764]">Bookings</span>
          </div>
          <p className="text-2xl font-bold text-[#3d2f28]">{metrics.totalBookings}</p>
          <p className="text-xs text-[#8b7764]">
            {metrics.paidCount} paid / {metrics.pendingCount} pending
          </p>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e8dfd8]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#6b5949]" />
            <span className="text-xs text-[#8b7764]">Attendance</span>
          </div>
          <p className="text-2xl font-bold text-[#3d2f28]">{metrics.attendanceRate}%</p>
          <p className="text-xs text-[#8b7764]">confirmed today</p>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e8dfd8]">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-[#6b5949]" />
            <span className="text-xs text-[#8b7764]">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-[#3d2f28]">{metrics.revenue.toLocaleString()}</p>
          <p className="text-xs text-[#8b7764]">DEN today</p>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8dfd8]">
        <div className="flex items-center justify-between p-4 border-b border-[#e8dfd8]">
          <h2 className="font-medium text-[#3d2f28]">Today's Classes</h2>
          <button
            onClick={() => onNavigate('classes')}
            className="text-sm text-[#6b5949] flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-[#e8dfd8]">
          {todayClasses.length === 0 ? (
            <div className="p-8 text-center text-[#8b7764]">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No classes scheduled today</p>
            </div>
          ) : (
            todayClasses.map((slot) => (
              <button
                key={slot.time}
                onClick={() => onNavigate('classes')}
                className="w-full p-4 hover:bg-[#f5f0ed] transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#3d2f28]">
                      {slot.time} - {slot.endTime}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">{getCapacityDots(slot.booked, slot.capacity)}</div>
                      <span className="text-sm text-[#8b7764]">
                        {slot.booked}/{slot.capacity}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8b7764]" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('users')}
          className="bg-white rounded-xl p-4 shadow-sm border border-[#e8dfd8] text-left hover:border-[#6b5949] transition-colors"
        >
          <Users className="w-6 h-6 text-[#6b5949] mb-2" />
          <p className="font-medium text-[#3d2f28]">Manage Users</p>
          <p className="text-xs text-[#8b7764]">View all members</p>
        </button>

        <button
          onClick={() => onNavigate('schedule')}
          className="bg-white rounded-xl p-4 shadow-sm border border-[#e8dfd8] text-left hover:border-[#6b5949] transition-colors"
        >
          <Clock className="w-6 h-6 text-[#6b5949] mb-2" />
          <p className="font-medium text-[#3d2f28]">Edit Schedule</p>
          <p className="text-xs text-[#8b7764]">Manage time slots</p>
        </button>
      </div>
    </div>
  );
}
