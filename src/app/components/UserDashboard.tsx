import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Calendar, 
  Package, 
  Settings,
  Camera,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Loader,
  Edit2,
  LogOut,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Language, translations } from '../translations';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import logo from 'figma:asset/d3b087d995c1120c4f6f827938a39596d087b710.png';

type UserDashboardProps = {
  userEmail: string;
  onLogout: () => void;
  onBookSession?: () => void;
  language: Language;
};

type UserProfile = {
  email: string;
  name: string;
  surname: string;
  mobile: string;
  bio?: string;
  profileImage?: string;
  sessionsRemaining: number;
  packageType: string | null;
  createdAt: string;
};

type Booking = {
  id: string;
  date: string;
  timeSlot: string;
  instructor: string;
  status: 'pending' | 'active' | 'used';
  selectedPackage?: string;
  activationCode?: string;
};

type DateSlot = {
  date: Date;
  dateKey: string;
  displayDate: string;
  timeSlots: TimeSlot[];
};

type TimeSlot = {
  time: string;
  available: number;
  isBooked: boolean;
};

export function UserDashboard({ userEmail, onLogout, onBookSession, language }: UserDashboardProps) {
  const t = translations[language];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'profile'>('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    surname: '',
    mobile: '',
    bio: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Booking state
  const [showBookingList, setShowBookingList] = useState(false);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [isLoadingAllBookings, setIsLoadingAllBookings] = useState(false);
  const [selectedInstructor] = useState<string>('Rina Krasniqi');
  const [bookingSlots, setBookingSlots] = useState<DateSlot[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [nextLesson, setNextLesson] = useState<{ date: Date; timeSlot: string } | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  // Confirmation dropdown state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    dateKey: string;
    date: Date;
    time: string;
    displayDate: string;
  } | null>(null);
  const [confirmForm, setConfirmForm] = useState({
    name: '',
    surname: '',
    mobile: '',
    email: '',
    payInStudio: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '16:00', '17:00', '18:00',
  ];

  useEffect(() => {
    loadUserData();
  }, [userEmail]);

  useEffect(() => {
    if (showBookingList) {
      loadAllBookings();
    }
  }, [showBookingList]);

  // Scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Calculate next lesson and countdown
  useEffect(() => {
    if (bookings.length === 0) {
      setNextLesson(null);
      return;
    }

    // Find the next upcoming lesson
    const now = new Date();
    const upcomingBookings = bookings
      .filter(booking => booking.status === 'active' || booking.status === 'pending')
      .map(booking => {
        const [day, month, year] = booking.date.split('/');
        const [hours, minutes] = booking.timeSlot.split(':');
        const lessonDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );
        return { date: lessonDate, timeSlot: booking.timeSlot, booking };
      })
      .filter(item => item.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (upcomingBookings.length > 0) {
      setNextLesson(upcomingBookings[0]);
    } else {
      setNextLesson(null);
    }
  }, [bookings]);

  // Update countdown every minute
  useEffect(() => {
    if (!nextLesson) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextLesson.date.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextLesson]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/user/profile?email=${userEmail}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.user);
        setEditForm({
          name: profileData.user.name || '',
          surname: profileData.user.surname || '',
          mobile: profileData.user.mobile || '',
          bio: profileData.user.bio || '',
        });
      }

      const bookingsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/user/bookings?email=${userEmail}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/user/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: userEmail,
            ...editForm,
            profileImage: selectedImage || profile?.profileImage,
          }),
        }
      );

      if (response.ok) {
        await loadUserData();
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadAllBookings = async () => {
    setIsLoadingAllBookings(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/bookings`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const dayBookings = (data.bookings || []).filter((booking: any) => 
          booking.instructor === selectedInstructor &&
          booking.status !== 'cancelled'
        );
        setAllBookings(dayBookings);
        generateBookingSlots(dayBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoadingAllBookings(false);
    }
  };

  const generateBookingSlots = (existingBookings: any[]) => {
    const slots: DateSlot[] = [];
    const startDate = new Date(2026, 0, 23); // January 23, 2026
    const endDate = new Date(2026, 1, 28); // February 28, 2026
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Only weekdays (Monday to Friday)
      if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
        // Use the same dateKey format as the rest of the app: "1-23", "2-3", etc.
        const dateKey = `${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
        const displayDate = formatDateForList(currentDate);
        
        const timeSlotsForDate = timeSlots.map(time => {
          const maxSpots = 4;
          const bookedSpots = existingBookings.filter(
            b => b.dateKey === dateKey && b.timeSlot === time
          ).length;
          
          return {
            time,
            available: maxSpots - bookedSpots,
            isBooked: bookedSpots >= maxSpots
          };
        });
        
        slots.push({
          date: new Date(currentDate),
          dateKey,
          displayDate,
          timeSlots: timeSlotsForDate
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setBookingSlots(slots);
    // Auto-expand first 5 dates by default
    if (slots.length > 0) {
      setExpandedDate(slots[0].dateKey);
    }
  };

  const formatDateForList = (date: Date) => {
    const day = date.getDate();
    const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
    const month = months[date.getMonth()];
    return `${day} ${month} 2026`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleBookSlot = (dateKey: string, date: Date, time: string) => {
    if ((profile?.sessionsRemaining || 0) <= 0) {
      alert('Nuk keni klasë të mbetura');
      return;
    }

    // Find the display date
    const slot = bookingSlots.find(s => s.dateKey === dateKey);
    
    // Pre-fill the form with user data
    setConfirmForm({
      name: profile?.name || '',
      surname: profile?.surname || '',
      mobile: profile?.mobile || '',
      email: userEmail,
      payInStudio: true,
    });

    // Set selected slot
    setSelectedSlot({
      dateKey,
      date,
      time,
      displayDate: slot?.displayDate || formatDateForList(date),
    });

    // Show confirmation dropdown
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);

    // Immediately mark as booked in UI
    setBookingSlots(prevSlots => 
      prevSlots.map(slot => {
        if (slot.dateKey === selectedSlot.dateKey) {
          return {
            ...slot,
            timeSlots: slot.timeSlots.map(ts => 
              ts.time === selectedSlot.time 
                ? { ...ts, available: ts.available - 1, isBooked: true }
                : ts
            )
          };
        }
        return slot;
      })
    );

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            name: confirmForm.name,
            surname: confirmForm.surname,
            mobile: confirmForm.mobile,
            email: confirmForm.email,
            date: formatDate(selectedSlot.date),
            dateKey: selectedSlot.dateKey,
            timeSlot: selectedSlot.time,
            instructor: selectedInstructor,
            selectedPackage: null,
            payInStudio: confirmForm.payInStudio,
            language: language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Rezervimi dështoi');
        // Revert the UI change if booking failed
        await loadAllBookings();
        setIsSubmitting(false);
        return;
      }

      console.log('Booking created successfully:', data);
      
      // Close confirmation dropdown
      setShowConfirmation(false);
      setSelectedSlot(null);
      
      // Reload data
      await loadUserData();
      await loadAllBookings();
      
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Gabim në rrjet. Ju lutem provoni përsëri.');
      // Revert the UI change if booking failed
      await loadAllBookings();
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#9ca571] animate-spin" />
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto px-5 py-4 pt-12 pb-24 bg-[#faf8f6]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10" />
          <div>
            <h1 className="text-lg text-[#3d2f28] font-medium">
              Mirë se vini, {profile?.name}!
            </h1>
            <p className="text-xs text-[#8b7764]">Paneli i anëtarëve</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Dalje"
        >
          <LogOut className="w-5 h-5 text-[#6b5949]" />
        </button>
      </div>

      {/* Countdown Timer for Next Lesson */}
      {activeTab === 'overview' && nextLesson && (
        <div className="bg-gradient-to-br from-[#9ca571] to-[#8a9463] rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-white" />
            <p className="text-xs text-white/90 font-medium">Klasa juaj tjetër</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-2xl text-white font-bold mb-1">
                {countdown.days > 0 && `${countdown.days}d `}
                {countdown.hours}h {countdown.minutes}m
              </p>
              <p className="text-xs text-white/80">
                {nextLesson.date.toLocaleDateString('sq-AL', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })} në {nextLesson.timeSlot}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-[#9ca571]" />
                <p className="text-xs text-[#8b7764]">Klasë të mbetura</p>
              </div>
              <p className="text-2xl text-[#3d2f28] font-medium">{profile?.sessionsRemaining || 0}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#9ca571]" />
                <p className="text-xs text-[#8b7764]">Rezervime totale</p>
              </div>
              <p className="text-2xl text-[#3d2f28] font-medium">{bookings.length}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <h2 className="text-sm text-[#3d2f28] font-medium mb-3">Veprime të shpejta</h2>
            <div className="space-y-2">
              <button
                onClick={() => setShowBookingList(!showBookingList)}
                disabled={(profile?.sessionsRemaining || 0) <= 0}
                className={`w-full py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${
                  (profile?.sessionsRemaining || 0) > 0
                    ? 'bg-[#9ca571] text-white hover:bg-[#8a9463]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {showBookingList ? 'Mbyll listën' : 'Rezervo klasë të re'}
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className="w-full bg-[#f5f0ed] text-[#6b5949] py-3 rounded-xl text-sm hover:bg-[#e8dfd8] transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Shiko rezervimet
              </button>
            </div>
          </div>

          {/* Booking List */}
          {showBookingList && (
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
              <h2 className="text-sm text-[#3d2f28] font-medium mb-3">
                Orare të disponueshme (23 Janar - 28 Shkurt)
              </h2>
              
              {isLoadingAllBookings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-[#9ca571] animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {bookingSlots.map((dateSlot) => (
                    <div key={dateSlot.dateKey} className="border border-[#e8dfd8] rounded-lg">
                      <button
                        onClick={() => setExpandedDate(expandedDate === dateSlot.dateKey ? null : dateSlot.dateKey)}
                        className="w-full flex items-center justify-between p-3 hover:bg-[#f5f0ed] transition-colors"
                      >
                        <span className="text-sm text-[#3d2f28] font-medium">{dateSlot.displayDate}</span>
                        {expandedDate === dateSlot.dateKey ? (
                          <ChevronUp className="w-4 h-4 text-[#6b5949]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#6b5949]" />
                        )}
                      </button>
                      
                      {expandedDate === dateSlot.dateKey && (
                        <div className="p-3 pt-0 space-y-2">
                          {dateSlot.timeSlots.map((slot) => {
                            const [hour, minute] = slot.time.split(':');
                            const endMinute = parseInt(minute) + 50;
                            const endHour = endMinute >= 60 ? parseInt(hour) + 1 : parseInt(hour);
                            const finalEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
                            const endTime = `${endHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`;
                            
                            return (
                              <div
                                key={slot.time}
                                className="flex items-center justify-between bg-[#f5f0ed] rounded-lg p-2"
                              >
                                <span className="text-sm text-[#3d2f28]">
                                  {slot.time} - {endTime}
                                </span>
                                <button
                                  onClick={() => handleBookSlot(dateSlot.dateKey, dateSlot.date, slot.time)}
                                  disabled={slot.available <= 0}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    slot.available > 0
                                      ? 'bg-[#9ca571] text-white hover:bg-[#8a9463]'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  {slot.available > 0 ? `${slot.available} vende të lira` : 'Plot'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <h2 className="text-sm text-[#3d2f28] font-medium mb-3">Rezervime të fundit</h2>
            {bookings.length === 0 ? (
              <p className="text-xs text-[#8b7764] text-center py-4">
                Akoma nuk keni rezervime
              </p>
            ) : (
              <div className="space-y-2">
                {bookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="bg-[#f5f0ed] rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-sm text-[#3d2f28] font-medium">{booking.date}</p>
                        <p className="text-xs text-[#8b7764]">{booking.timeSlot}</p>
                      </div>
                      {booking.status === 'active' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : booking.status === 'used' ? (
                        <CheckCircle className="w-4 h-4 text-[#8b7764]" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    <p className="text-xs text-[#6b5949]">{booking.instructor}</p>
                    {booking.selectedPackage && (
                      <p className="text-xs text-[#9ca571] mt-1">
                        {booking.selectedPackage.replace('package', '')} KLASA
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base text-[#3d2f28] font-medium">Rezervimet e mia</h2>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs text-[#9ca571] hover:text-[#8a9463]"
            >
              Kthehu
            </button>
          </div>
          
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <Calendar className="w-12 h-12 text-[#e8dfd8] mx-auto mb-3" />
              <p className="text-sm text-[#8b7764] mb-4">
                Akoma nuk keni rezervime
              </p>
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setShowBookingList(true);
                }}
                disabled={(profile?.sessionsRemaining || 0) <= 0}
                className={`px-6 py-2 rounded-xl text-sm transition-colors ${
                  (profile?.sessionsRemaining || 0) > 0
                    ? 'bg-[#9ca571] text-white hover:bg-[#8a9463]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Rezervo tani
              </button>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-base text-[#3d2f28] font-medium">{booking.date}</p>
                      {booking.status === 'active' ? (
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">
                          Aktiv
                        </span>
                      ) : booking.status === 'used' ? (
                        <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">
                          Përfunduar
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full">
                          Në pritje
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8b7764] mb-1">
                      <Clock className="w-3 h-3" />
                      <span>{booking.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8b7764]">
                      <User className="w-3 h-3" />
                      <span>{booking.instructor}</span>
                    </div>
                  </div>
                </div>
                
                {booking.selectedPackage && (
                  <div className="bg-[#f5f0ed] rounded-lg p-2 mt-2">
                    <p className="text-xs text-[#6b5949]">
                      <span className="font-medium">Paketë:</span>{' '}
                      {booking.selectedPackage.replace('package', '')} KLASA
                    </p>
                  </div>
                )}
                
                {booking.activationCode && booking.status === 'pending' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-orange-700">
                      <span className="font-medium">Kod aktivizimi:</span>{' '}
                      <span className="font-mono">{booking.activationCode}</span>
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base text-[#3d2f28] font-medium">Profili im</h2>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs text-[#9ca571] hover:text-[#8a9463]"
            >
              Kthehu
            </button>
          </div>

          {/* Profile Picture */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative">
                {selectedImage || profile?.profileImage ? (
                  <img 
                    src={selectedImage || profile?.profileImage} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-[#9ca571] rounded-full flex items-center justify-center text-white text-2xl font-medium">
                    {profile?.name?.[0]}{profile?.surname?.[0]}
                  </div>
                )}
                <label 
                  htmlFor="profile-image-upload" 
                  className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-white cursor-pointer hover:bg-[#f5f0ed] transition-colors"
                >
                  <Camera className="w-3 h-3 text-[#6b5949]" />
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <p className="text-base text-[#3d2f28] font-medium">
                  {profile?.name} {profile?.surname}
                </p>
                <p className="text-xs text-[#8b7764]">{profile?.email}</p>
                {selectedImage && (
                  <button
                    onClick={() => {
                      handleUpdateProfile();
                      setSelectedImage(null);
                    }}
                    className="text-xs text-[#9ca571] hover:text-[#8a9463] mt-1"
                  >
                    Ruaj foton
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-[#3d2f28] font-medium">Informacioni personal</h3>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs text-[#9ca571] hover:text-[#8a9463] flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Ndrysho
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#6b5949] mb-1">Emri</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#f5f0ed] text-sm text-[#3d2f28] focus:outline-none focus:ring-2 focus:ring-[#9ca571]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b5949] mb-1">Mbiemri</label>
                  <input
                    type="text"
                    value={editForm.surname}
                    onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#f5f0ed] text-sm text-[#3d2f28] focus:outline-none focus:ring-2 focus:ring-[#9ca571]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b5949] mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#f5f0ed] text-sm text-[#3d2f28] focus:outline-none focus:ring-2 focus:ring-[#9ca571]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b5949] mb-1">Bio (opsionale)</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#f5f0ed] text-sm text-[#3d2f28] focus:outline-none focus:ring-2 focus:ring-[#9ca571] resize-none"
                    rows={3}
                    placeholder="Tregoni rreth vetes suaj..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 bg-[#f5f0ed] text-[#6b5949] py-2 rounded-lg text-sm hover:bg-[#e8dfd8] transition-colors"
                  >
                    Anulo
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-[#9ca571] text-white py-2 rounded-lg text-sm hover:bg-[#8a9463] transition-colors"
                  >
                    Ruaj
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#9ca571]" />
                  <div>
                    <p className="text-xs text-[#8b7764]">Email</p>
                    <p className="text-sm text-[#3d2f28]">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#9ca571]" />
                  <div>
                    <p className="text-xs text-[#8b7764]">Telefon</p>
                    <p className="text-sm text-[#3d2f28]">{profile?.mobile}</p>
                  </div>
                </div>
                {profile?.bio && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-[#9ca571] mt-1" />
                    <div>
                      <p className="text-xs text-[#8b7764]">Bio</p>
                      <p className="text-sm text-[#3d2f28]">{profile.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm text-[#3d2f28] font-medium mb-3">Informacioni i llogarisë</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8b7764]">Anëtar që prej</span>
                <span className="text-[#3d2f28]">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8b7764]">Paketa aktuale</span>
                <span className="text-[#3d2f28]">
                  {profile?.packageType || 'Nuk ka paketë aktive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dropdown Overlay */}
      {showConfirmation && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-5">
          <div className="bg-[#faf8f6] rounded-2xl w-full max-w-md shadow-xl animate-slide-down">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[#e8dfd8]">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedSlot(null);
                }}
                className="p-1 hover:bg-white/50 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-[#6b5949] rotate-90" />
              </button>
              <h2 className="text-base text-[#3d2f28] font-medium">
                {t.confirmReservation}
              </h2>
            </div>

            {/* Booking Details */}
            <div className="p-4 bg-white m-4 rounded-xl">
              <p className="text-xs text-[#8b7764] mb-1">{selectedSlot.displayDate}</p>
              <p className="text-sm text-[#3d2f28] font-medium mb-1">
                {selectedSlot.time} (50 min)
              </p>
              <p className="text-xs text-[#6b5949] mb-3">
                {t.instructor}: {selectedInstructor}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[#e8dfd8]">
                <span className="text-xs text-[#8b7764]">{t.price}:</span>
                <span className="text-lg text-[#3d2f28] font-medium">600 DEN</span>
              </div>
            </div>

            {/* Form */}
            <div className="px-4 pb-4 space-y-3">
              <input
                type="text"
                placeholder={`${t.name}*`}
                value={confirmForm.name}
                onChange={(e) => setConfirmForm({ ...confirmForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-[#f5f0ed] rounded-xl text-sm text-[#3d2f28] placeholder:text-[#8b7764] border-none focus:outline-none focus:ring-2 focus:ring-[#9ca571]"
              />
              <input
                type="text"
                placeholder={`${t.surname}*`}
                value={confirmForm.surname}
                onChange={(e) => setConfirmForm({ ...confirmForm, surname: e.target.value })}
                className="w-full px-4 py-3 bg-[#f5f0ed] rounded-xl text-sm text-[#3d2f28] placeholder:text-[#8b7764] border-none focus:outline-none focus:ring-2 focus:ring-[#9ca571]"
              />
              <input
                type="tel"
                placeholder={`${t.mobile}*`}
                value={confirmForm.mobile}
                onChange={(e) => setConfirmForm({ ...confirmForm, mobile: e.target.value })}
                className="w-full px-4 py-3 bg-[#f5f0ed] rounded-xl text-sm text-[#3d2f28] placeholder:text-[#8b7764] border-none focus:outline-none focus:ring-2 focus:ring-[#9ca571]"
              />
              <input
                type="email"
                placeholder={`${t.email}*`}
                value={confirmForm.email}
                onChange={(e) => setConfirmForm({ ...confirmForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-[#f5f0ed] rounded-xl text-sm text-[#3d2f28] placeholder:text-[#8b7764] border-none focus:outline-none focus:ring-2 focus:ring-[#9ca571]"
              />

              {/* Pay in Studio Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmForm.payInStudio}
                  onChange={(e) => setConfirmForm({ ...confirmForm, payInStudio: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded border-[#9ca571] text-[#9ca571] focus:ring-[#9ca571]"
                />
                <span className="text-xs text-[#6b5949]">
                  {t.payInStudio}
                </span>
              </label>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmBooking}
                disabled={isSubmitting || !confirmForm.name || !confirmForm.surname || !confirmForm.mobile || !confirmForm.email}
                className="w-full bg-[#9ca571] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#8a9463] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t.submitting : t.confirmBooking}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8dfd8] px-5 py-3 flex justify-around">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'overview' ? 'text-[#9ca571]' : 'text-[#8b7764]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Përmbledhje</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'bookings' ? 'text-[#9ca571]' : 'text-[#8b7764]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Rezervime</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'profile' ? 'text-[#9ca571]' : 'text-[#8b7764]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Profili</span>
        </button>
      </div>
    </div>
  );
}