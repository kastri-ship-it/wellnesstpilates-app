import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, DollarSign, User } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getTimeSlotsForDate, calculateEndTime } from '../../config/timeSlots';

type Booking = {
  id: string;
  name: string;
  surname: string;
  email: string;
  mobile: string;
  timeSlot: string;
  dateKey: string;
  reservationStatus: string;
  paymentStatus: string;
  selectedPackage?: string;
  serviceType?: string;
};

type TimeSlotData = {
  time: string;
  endTime: string;
  bookings: Booking[];
  capacity: number;
};

export function ClassesView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dates, setDates] = useState<Array<{ dateKey: string; display: string; dayName: string }>>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([]);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Generate dates (next 30 weekdays)
  useEffect(() => {
    const generatedDates: Array<{ dateKey: string; display: string; dayName: string }> = [];
    const today = new Date();
    let current = new Date(today);

    // Start from today
    while (generatedDates.length < 30) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateKey = `${current.getMonth() + 1}-${current.getDate()}`;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        generatedDates.push({
          dateKey,
          display: `${current.getDate()} ${monthNames[current.getMonth()]}`,
          dayName: dayNames[dayOfWeek],
        });
      }
      current.setDate(current.getDate() + 1);
    }

    setDates(generatedDates);
    if (generatedDates.length > 0) {
      setSelectedDate(generatedDates[0].dateKey);
    }
  }, []);

  // Fetch all bookings
  useEffect(() => {
    fetchBookings();
  }, []);

  // Update time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      updateTimeSlots();
    }
  }, [selectedDate, bookings]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/bookings`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeSlots = () => {
    const slots = getTimeSlotsForDate(selectedDate);
    const dateBookings = bookings.filter((b) => b.dateKey === selectedDate);

    const slotData: TimeSlotData[] = slots.map((time) => ({
      time,
      endTime: calculateEndTime(time, selectedDate),
      bookings: dateBookings.filter((b) => b.timeSlot === time),
      capacity: 4,
    }));

    setTimeSlots(slotData);
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'no_show') => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/reservations/${encodeURIComponent(bookingId)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            reservationStatus: newStatus,
            paymentStatus: newStatus === 'confirmed' ? 'paid' : 'unpaid',
          }),
        }
      );

      if (response.ok) {
        // Refresh bookings
        fetchBookings();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleMarkPaid = async (booking: Booking) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/users/${encodeURIComponent(booking.email)}/payment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ paymentStatus: 'paid' }),
        }
      );

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'attended':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'no_show':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentColor = (status: string) => {
    return status === 'paid'
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700';
  };

  const getCapacityColor = (booked: number, capacity: number) => {
    const ratio = booked / capacity;
    if (ratio >= 1) return 'from-green-500 to-green-600';
    if (ratio >= 0.75) return 'from-lime-500 to-lime-600';
    if (ratio >= 0.5) return 'from-yellow-500 to-yellow-600';
    if (ratio >= 0.25) return 'from-orange-500 to-orange-600';
    return 'from-red-400 to-red-500';
  };

  const scrollDates = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Date Scroller */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8dfd8] p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollDates('left')}
            className="p-1 hover:bg-[#f5f0ed] rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-[#6b5949]" />
          </button>

          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide flex gap-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {dates.map((date) => {
              const isSelected = selectedDate === date.dateKey;
              const dateBookings = bookings.filter((b) => b.dateKey === date.dateKey);
              const hasBookings = dateBookings.length > 0;

              return (
                <button
                  key={date.dateKey}
                  onClick={() => setSelectedDate(date.dateKey)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-[#6b5949] text-white'
                      : hasBookings
                      ? 'bg-[#f5f0ed] text-[#3d2f28] hover:bg-[#e8dfd8]'
                      : 'bg-white text-[#8b7764] hover:bg-[#f5f0ed] border border-[#e8dfd8]'
                  }`}
                >
                  <p className="text-xs">{date.dayName}</p>
                  <p className="font-medium">{date.display}</p>
                  {hasBookings && !isSelected && (
                    <div className="w-1.5 h-1.5 bg-[#6b5949] rounded-full mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollDates('right')}
            className="p-1 hover:bg-[#f5f0ed] rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-[#6b5949]" />
          </button>
        </div>
      </div>

      {/* Time Slots */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#6b5949] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {timeSlots.map((slot) => {
            const isExpanded = expandedSlot === slot.time;
            const fillPercentage = (slot.bookings.length / slot.capacity) * 100;

            return (
              <div key={slot.time} className="bg-white rounded-xl shadow-sm border border-[#e8dfd8] overflow-hidden">
                {/* Slot Header */}
                <button
                  onClick={() => setExpandedSlot(isExpanded ? null : slot.time)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#3d2f28]">
                        {slot.time} - {slot.endTime}
                      </p>
                      <p className="text-sm text-[#8b7764]">
                        {slot.bookings.length === 0
                          ? 'No bookings'
                          : slot.bookings.length === slot.capacity
                          ? 'Fully booked'
                          : `${slot.bookings.length} booked`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#3d2f28]">
                        {slot.bookings.length}
                        <span className="text-sm font-normal text-[#8b7764]">/{slot.capacity}</span>
                      </p>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getCapacityColor(slot.bookings.length, slot.capacity)} transition-all duration-500`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </button>

                {/* Expanded Participants */}
                {isExpanded && slot.bookings.length > 0 && (
                  <div className="border-t border-[#e8dfd8] bg-[#f5f0ed]/50">
                    {slot.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 border-b border-[#e8dfd8] last:border-b-0"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#6b5949] rounded-full flex items-center justify-center text-white font-medium">
                              {booking.name[0]}{booking.surname[0]}
                            </div>
                            <div>
                              <p className="font-medium text-[#3d2f28]">
                                {booking.name} {booking.surname}
                              </p>
                              <p className="text-sm text-[#8b7764]">
                                {booking.selectedPackage
                                  ? booking.selectedPackage.replace('package', '') + ' Sessions'
                                  : 'Single Session'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(booking.paymentStatus)}`}>
                              {booking.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            disabled={booking.reservationStatus === 'confirmed' || booking.reservationStatus === 'attended'}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                              booking.reservationStatus === 'confirmed' || booking.reservationStatus === 'attended'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {booking.reservationStatus === 'confirmed' || booking.reservationStatus === 'attended'
                              ? 'Attended'
                              : 'Attended'}
                          </button>

                          <button
                            onClick={() => handleStatusChange(booking.id, 'no_show')}
                            disabled={booking.reservationStatus === 'no_show'}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                              booking.reservationStatus === 'no_show'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            No-Show
                          </button>

                          {booking.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(booking)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-[#6b5949] text-white hover:bg-[#5a4838] transition-colors"
                            >
                              <DollarSign className="w-4 h-4" />
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state for expanded with no bookings */}
                {isExpanded && slot.bookings.length === 0 && (
                  <div className="border-t border-[#e8dfd8] p-8 text-center text-[#8b7764]">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No participants yet</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
