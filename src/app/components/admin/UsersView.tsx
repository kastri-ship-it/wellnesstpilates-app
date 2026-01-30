import { useState, useEffect } from 'react';
import {
  Search, Filter, ChevronDown, ChevronUp, Mail, Gift, Ban, CheckCircle,
  Phone, Calendar, Package, User, X, Clock
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

type UserData = {
  id: string;
  name: string;
  surname: string;
  email: string;
  mobile: string;
  paymentStatus: 'paid' | 'unpaid';
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  packages: Array<{
    type: string;
    sessions: number;
    purchasedDate: string;
  }>;
  isBlocked?: boolean;
  packageType?: string;
};

type UserBooking = {
  id: string;
  userEmail: string;
  userName: string;
  userSurname: string;
  dateKey: string;
  timeSlot: string;
  bookingDate: string;
  status: string;
  createdAt: string;
};

type FilterType = 'paid' | 'pending' | 'blocked';

export function UsersView() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('paid');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [giftSessions, setGiftSessions] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBookings, setUserBookings] = useState<Record<string, UserBooking[]>>({});

  useEffect(() => {
    fetchUsers();
    fetchUserBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, activeFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/users`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/user-bookings`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      const data = await response.json();
      // Group bookings by user email
      const grouped: Record<string, UserBooking[]> = {};
      (data.bookings || []).forEach((booking: UserBooking) => {
        const email = booking.userEmail;
        if (!grouped[email]) {
          grouped[email] = [];
        }
        grouped[email].push(booking);
      });
      setUserBookings(grouped);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  const applyFilters = () => {
    let result = [...users];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.surname.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.mobile.includes(query)
      );
    }

    // Apply filter
    switch (activeFilter) {
      case 'paid':
        result = result.filter((u) => u.paymentStatus === 'paid');
        break;
      case 'pending':
        result = result.filter((u) => u.paymentStatus !== 'paid');
        break;
      case 'blocked':
        result = result.filter((u) => u.isBlocked);
        break;
    }

    setFilteredUsers(result);
  };

  const handleGiftSessions = async () => {
    if (!selectedUser || giftSessions < 1) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/users/${encodeURIComponent(selectedUser.email)}/gift`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ sessions: giftSessions }),
        }
      );

      if (response.ok) {
        await fetchUsers();
        setShowGiftModal(false);
        setSelectedUser(null);
        setGiftSessions(1);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to gift sessions');
      }
    } catch (error) {
      console.error('Error gifting sessions:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleBlock = async (user: UserData) => {
    const action = user.isBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} ${user.name} ${user.surname}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/users/${encodeURIComponent(user.email)}/block`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ blocked: !user.isBlocked }),
        }
      );

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling block:', error);
    }
  };

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'paid', label: 'Paid', count: users.filter((u) => u.paymentStatus === 'paid').length },
    { id: 'pending', label: 'Pending', count: users.filter((u) => u.paymentStatus !== 'paid').length },
    { id: 'blocked', label: 'Blacklist', count: users.filter((u) => u.isBlocked).length },
  ];

  const getPackageLabel = (type: string) => {
    if (type === 'package8') return '8 Sessions';
    if (type === 'package10') return '10 Sessions';
    if (type === 'package12') return '12 Sessions';
    if (type === 'single') return 'Single';
    return type;
  };

  const formatBookingDate = (dateKey: string) => {
    const [month, day] = dateKey.split('-').map(Number);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${monthNames[month - 1]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'no_show': return 'bg-orange-100 text-orange-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getNextClass = (email: string) => {
    const bookings = userBookings[email] || [];
    const now = new Date();
    const currentYear = now.getFullYear();

    // Filter for upcoming bookings (pending/confirmed/booked status, future date)
    const upcomingBookings = bookings
      .filter(b => b.status === 'pending' || b.status === 'confirmed' || b.status === 'booked')
      .map(b => {
        const [month, day] = b.dateKey.split('-').map(Number);
        const bookingDate = new Date(currentYear, month - 1, day);
        // If booking month is before current month, it's probably next year
        if (bookingDate < now && month < now.getMonth() + 1) {
          bookingDate.setFullYear(currentYear + 1);
        }
        return { ...b, date: bookingDate };
      })
      .filter(b => b.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcomingBookings[0] || null;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8dfd8] p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b7764]" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f5f0ed] rounded-lg text-[#3d2f28] placeholder-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-[#8b7764]" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === filter.id
                ? 'bg-[#6b5949] text-white'
                : 'bg-white text-[#6b5949] border border-[#e8dfd8] hover:bg-[#f5f0ed]'
            }`}
          >
            {filter.label}
            <span className={`ml-1.5 ${activeFilter === filter.id ? 'opacity-80' : 'opacity-60'}`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#6b5949] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-[#e8dfd8]">
          <User className="w-12 h-12 mx-auto mb-2 text-[#8b7764] opacity-30" />
          <p className="text-[#8b7764]">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isExpanded = expandedUserId === user.id;

            return (
              <div
                key={user.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-colors ${
                  user.isBlocked ? 'border-red-200 bg-red-50/30' : 'border-[#e8dfd8]'
                }`}
              >
                {/* User Header */}
                <button
                  onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                      user.isBlocked ? 'bg-red-400' : 'bg-[#6b5949]'
                    }`}>
                      {user.name[0]}{user.surname[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#3d2f28] truncate">
                          {user.name} {user.surname}
                        </p>
                        {user.packageType && (
                          <span className="px-2 py-0.5 bg-[#6b5949]/10 text-[#6b5949] text-xs rounded-full">
                            {getPackageLabel(user.packageType)}
                          </span>
                        )}
                        {user.isBlocked && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#8b7764] truncate">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#8b7764] mt-1 ml-auto" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#8b7764] mt-1 ml-auto" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-[#e8dfd8] bg-[#f5f0ed]/50 p-4 space-y-4">
                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-[#8b7764]" />
                        <span className="text-[#3d2f28]">{user.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-[#8b7764]" />
                        <span className="text-[#3d2f28] truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* Next Class */}
                    {(() => {
                      const nextClass = getNextClass(user.email);
                      return (
                        <div className={`rounded-lg p-3 ${nextClass ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-[#3d2f28]">Next Class</span>
                          </div>
                          {nextClass ? (
                            <p className="text-sm text-green-700 font-medium">
                              {formatBookingDate(nextClass.dateKey)} at {nextClass.timeSlot}
                            </p>
                          ) : (
                            <p className="text-sm text-[#8b7764]">No upcoming class scheduled</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Package Info */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-[#6b5949]" />
                        <span className="font-medium text-[#3d2f28]">Package</span>
                      </div>
                      {(user.packages.length > 0 || user.packageType) ? (
                        <div>
                          <p className="text-sm text-[#3d2f28]">
                            {getPackageLabel(user.packages[0]?.type || user.packageType || 'single')}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-[#8b7764]">Sessions remaining</span>
                            <span className="font-bold text-[#6b5949]">
                              {user.remainingSessions} / {user.totalSessions}
                            </span>
                          </div>
                          {user.totalSessions > 0 && (
                            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#6b5949] transition-all"
                                style={{
                                  width: `${((user.totalSessions - user.remainingSessions) / user.totalSessions) * 100}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[#8b7764]">No active package</p>
                      )}
                    </div>

                    {/* User Bookings */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-[#6b5949]" />
                        <span className="font-medium text-[#3d2f28]">Booked Sessions</span>
                        {userBookings[user.email]?.length > 0 && (
                          <span className="px-2 py-0.5 bg-[#6b5949]/10 text-[#6b5949] text-xs rounded-full">
                            {userBookings[user.email].length}
                          </span>
                        )}
                      </div>
                      {userBookings[user.email]?.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userBookings[user.email].map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between p-2 bg-[#f5f0ed] rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#8b7764]" />
                                <div>
                                  <p className="text-sm font-medium text-[#3d2f28]">
                                    {formatBookingDate(booking.dateKey)} at {booking.timeSlot}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#8b7764]">No bookings yet</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowGiftModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                      >
                        <Gift className="w-4 h-4" />
                        Gift Sessions
                      </button>

                      <button
                        onClick={() => handleToggleBlock(user)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          user.isBlocked
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {user.isBlocked ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4" />
                            Block
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Gift Sessions Modal */}
      {showGiftModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-4 border-b border-[#e8dfd8]">
              <h3 className="font-medium text-[#3d2f28]">Gift Sessions</h3>
              <p className="text-sm text-[#8b7764]">
                Add bonus sessions to {selectedUser.name}'s package
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setGiftSessions(Math.max(1, giftSessions - 1))}
                  className="w-10 h-10 rounded-full bg-[#f5f0ed] text-[#6b5949] font-bold text-xl hover:bg-[#e8dfd8]"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-[#3d2f28] w-12 text-center">
                  {giftSessions}
                </span>
                <button
                  onClick={() => setGiftSessions(giftSessions + 1)}
                  className="w-10 h-10 rounded-full bg-[#f5f0ed] text-[#6b5949] font-bold text-xl hover:bg-[#e8dfd8]"
                >
                  +
                </button>
              </div>
              <p className="text-center text-sm text-[#8b7764] mb-4">
                {giftSessions} session{giftSessions > 1 ? 's' : ''} will be added
              </p>
            </div>

            <div className="p-4 border-t border-[#e8dfd8] flex gap-2">
              <button
                onClick={() => {
                  setShowGiftModal(false);
                  setSelectedUser(null);
                  setGiftSessions(1);
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#f5f0ed] text-[#6b5949] font-medium hover:bg-[#e8dfd8]"
              >
                Cancel
              </button>
              <button
                onClick={handleGiftSessions}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50"
              >
                {isProcessing ? 'Adding...' : 'Add Sessions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
