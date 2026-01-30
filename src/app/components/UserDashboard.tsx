import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Calendar, Clock, Plus, X, Check } from 'lucide-react';
import { Language, translations } from '../translations';
import { projectId, publicAnonKey } from '/utils/supabase/info';

type UserDashboardProps = {
  onBack: () => void;
  language: Language;
  sessionToken: string;
  userEmail: string;
};

type SessionDetails = {
  id: string;
  dateKey: string;
  timeSlot: string;
  endTime: string;
  displayDate: string;
};

type PackageDetails = {
  id: string;
  packageType: string;
  packageStatus: 'pending' | 'active';
  totalSessions: number;
  remainingSessions: number;
  sessions: SessionDetails[];
  createdAt: string;
};

type TimeSlot = {
  time: string;
  available: number;
  isBooked: boolean;
};

type DateSlot = {
  date: Date;
  dateKey: string;
  displayDate: string;
  timeSlots: TimeSlot[];
};

export function UserDashboard({ onBack, language, sessionToken, userEmail }: UserDashboardProps) {
  const t = translations[language];
  const [packages, setPackages] = useState<PackageDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<DateSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isRemovingSession, setIsRemovingSession] = useState<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const activeSessionToken = sessionToken || localStorage.getItem('wellnest_session') || '';

  // Load user's packages
  const loadPackages = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/user/packages`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': activeSessionToken,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load packages:', response.status, errorData);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setPackages(data.packages);
        console.log('Loaded user packages:', data.packages);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load available slots
  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/slots/available`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to load slots');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.slots);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (activeSessionToken) {
      loadPackages();
      loadAvailableSlots();
    } else {
      setLoading(false);
      setLoadingSlots(false);
    }
  }, [activeSessionToken]);

  // Add a session to the package
  const handleAddSession = async (pkg: PackageDetails, dateKey: string, timeSlot: string) => {
    setIsAddingSession(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/user/packages/${pkg.id}/sessions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': activeSessionToken,
          },
          body: JSON.stringify({ dateKey, timeSlot }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to add session');
        return;
      }

      // Reload packages and slots
      await Promise.all([loadPackages(), loadAvailableSlots()]);
      setShowClassPicker(false);
      setSelectedSlotIndex(null);
    } catch (error) {
      console.error('Error adding session:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsAddingSession(false);
    }
  };

  // Remove a session from the package
  const handleRemoveSession = async (pkg: PackageDetails, sessionId: string) => {
    if (!confirm(t.confirmRemove || 'Remove this class?')) return;

    setIsRemovingSession(sessionId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/user/packages/${pkg.id}/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': activeSessionToken,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to remove session');
        return;
      }

      // Reload packages and slots
      await Promise.all([loadPackages(), loadAvailableSlots()]);
    } catch (error) {
      console.error('Error removing session:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsRemovingSession(null);
    }
  };

  // Get the active package (first one with sessions)
  const activePackage = packages[0];
  const usedSessions = activePackage ? activePackage.totalSessions - activePackage.remainingSessions : 0;
  const totalSessions = activePackage?.totalSessions || 0;
  const bookedSessions = activePackage?.sessions || [];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#9ca571] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-[#6b5949]">{t.loading || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f3f0]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e6e3] px-4 py-4 pt-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="hover:bg-[#e8dfd8] rounded-lg p-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#6b5949]" />
          </button>
          <h1 className="text-lg font-semibold text-[#3d2f28]">
            {t.myPackages || 'My Packages'}
          </h1>
          <div className="w-9" />
        </div>

        {/* User Info */}
        <div className="mt-3 text-center">
          <p className="text-xs text-[#8b7764]">{t.loggedInAs || 'Logged in as'}</p>
          <p className="text-sm font-medium text-[#3d2f28]">{userEmail}</p>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {packages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-16 h-16 text-[#e8e6e3] mx-auto mb-4" />
            <p className="text-sm text-[#6b5949]">
              {t.noPackagesYet || 'No packages booked yet'}
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {/* ========== SECTION A: MY FIRM CLASSES ========== */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e8e6e3]">
              <h2 className="text-base font-semibold text-[#3d2f28] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#9ca571]" />
                {t.myFirmClasses || 'My Classes'}
              </h2>

              {/* Slots Grid */}
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: totalSessions }).map((_, index) => {
                  const session = bookedSessions[index];
                  const isRemoving = session && isRemovingSession === session.id;

                  if (session) {
                    // Filled slot
                    return (
                      <div
                        key={session.id}
                        className="bg-gradient-to-br from-[#9ca571] to-[#8a9463] rounded-xl p-3 text-white relative"
                      >
                        <div className="text-xs opacity-80 mb-1">
                          {t.firstSession || 'Session'} {index + 1}
                        </div>
                        <div className="font-semibold text-sm mb-1">
                          {session.displayDate}
                        </div>
                        <div className="flex items-center gap-1 text-xs opacity-90">
                          <Clock className="w-3 h-3" />
                          {session.timeSlot} - {session.endTime}
                        </div>
                        <button
                          onClick={() => handleRemoveSession(activePackage, session.id)}
                          disabled={isRemoving}
                          className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors"
                        >
                          {isRemoving ? (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  } else {
                    // Empty slot
                    return (
                      <button
                        key={`empty-${index}`}
                        onClick={() => {
                          setSelectedSlotIndex(index);
                          setShowClassPicker(true);
                        }}
                        className="bg-[#f5f0ed] border-2 border-dashed border-[#d4cdc5] rounded-xl p-3 hover:bg-[#ebe5df] hover:border-[#9ca571] transition-all flex flex-col items-center justify-center min-h-[90px]"
                      >
                        <Plus className="w-6 h-6 text-[#9ca571] mb-1" />
                        <span className="text-xs text-[#6b5949] font-medium">
                          {t.addClass || 'Add Class'}
                        </span>
                        <span className="text-[10px] text-[#8b7764] mt-0.5">
                          Slot {index + 1}
                        </span>
                      </button>
                    );
                  }
                })}
              </div>
            </div>

            {/* ========== SECTION B: AVAILABLE CLASSES ========== */}
            {showClassPicker && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e8e6e3]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[#3d2f28] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#9ca571]" />
                    {t.availableClasses || 'Available Classes'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowClassPicker(false);
                      setSelectedSlotIndex(null);
                    }}
                    className="text-[#8b7764] hover:text-[#6b5949]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-[#9ca571] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#6b5949]">
                      {t.noSlotsAvailable || 'No slots available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {availableSlots.map((dateSlot) => (
                      <div key={dateSlot.dateKey}>
                        <p className="text-sm font-semibold text-[#3d2f28] mb-2 sticky top-0 bg-white py-1">
                          {dateSlot.displayDate}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {dateSlot.timeSlots.map((slot) => {
                            const isBooked = bookedSessions.some(
                              s => s.dateKey === dateSlot.dateKey && s.timeSlot === slot.time
                            );
                            const isAvailable = slot.available > 0 && !isBooked;

                            return (
                              <button
                                key={slot.time}
                                onClick={() => isAvailable && handleAddSession(activePackage, dateSlot.dateKey, slot.time)}
                                disabled={!isAvailable || isAddingSession}
                                className={`py-2.5 px-2 rounded-xl text-center transition-all ${
                                  isBooked
                                    ? 'bg-[#9ca571]/20 text-[#9ca571] cursor-not-allowed'
                                    : isAvailable
                                    ? 'bg-gradient-to-br from-[#f5f0ed] to-[#f0ebe6] hover:from-[#9ca571] hover:to-[#8a9463] hover:text-white'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  {isBooked ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-[#9ca571]" />
                                  )}
                                  <span className="text-xs font-medium">
                                    {slot.time}
                                  </span>
                                </div>
                                <span className={`text-[10px] ${
                                  isBooked
                                    ? 'text-[#9ca571]'
                                    : slot.available > 2
                                    ? 'text-green-600'
                                    : slot.available > 0
                                    ? 'text-orange-600'
                                    : 'text-gray-400'
                                }`}>
                                  {isBooked
                                    ? 'Booked'
                                    : slot.available > 0
                                    ? `${slot.available} ${t.spotsLeft || 'spots'}`
                                    : t.full || 'Full'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isAddingSession && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                    <div className="w-8 h-8 border-3 border-[#9ca571] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Classes Preview (when picker is closed) */}
            {!showClassPicker && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e8e6e3]">
                <h2 className="text-base font-semibold text-[#3d2f28] mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#9ca571]" />
                  {t.upcomingClasses || 'Upcoming Classes'}
                </h2>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-[#9ca571] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-[#e8e6e3] mx-auto mb-3" />
                    <p className="text-sm text-[#6b5949]">
                      {t.noUpcomingClasses || 'No upcoming classes available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableSlots.slice(0, 3).map((dateSlot) => (
                      <div key={dateSlot.dateKey} className="bg-[#f5f0ed] rounded-xl p-3">
                        <p className="text-sm font-semibold text-[#3d2f28] mb-2">
                          {dateSlot.displayDate}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dateSlot.timeSlots.slice(0, 4).map((slot) => (
                            <span
                              key={slot.time}
                              className={`text-xs px-2 py-1 rounded-lg ${
                                slot.available > 0
                                  ? 'bg-white text-[#3d2f28]'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                            >
                              {slot.time} ({slot.available} {t.spotsLeft || 'spots'})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== SECTION C: STICKY BOTTOM BAR ========== */}
      {activePackage && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e6e3] px-4 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#3d2f28]">
                <span className="font-semibold">{t.slotsUsed || 'Slots used'}:</span>{' '}
                <span className="text-[#9ca571] font-bold">{bookedSessions.length}</span>
                <span className="text-[#8b7764]"> / {totalSessions}</span>
              </p>
              <p className="text-xs text-[#8b7764]">
                {activePackage.remainingSessions} {t.remaining || 'remaining'}
              </p>
            </div>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-[#9ca571] to-[#8a9463] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              {t.done || 'Done'}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-[#e8e6e3] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#9ca571] transition-all"
              style={{ width: `${(bookedSessions.length / totalSessions) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
