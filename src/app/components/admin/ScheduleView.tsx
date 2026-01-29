import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Plus, Trash2, Save, X, ChevronLeft, ChevronRight, Ban
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  DEFAULT_TIME_SLOTS,
  DATE_SPECIFIC_SLOTS,
  DATE_SPECIFIC_DURATIONS,
  DEFAULT_DURATION,
} from '../../config/timeSlots';

type ScheduleConfig = {
  workingDays: number[];
  defaultSlots: string[];
  defaultDuration: number;
  blockedDates: string[];
  customSlots: Record<string, { slots: string[]; duration: number }>;
};

type DayOfWeek = {
  id: number;
  name: string;
  short: string;
};

const DAYS_OF_WEEK: DayOfWeek[] = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
  { id: 0, name: 'Sunday', short: 'Sun' },
];

export function ScheduleView() {
  const [config, setConfig] = useState<ScheduleConfig>({
    workingDays: [1, 2, 3, 4, 5],
    defaultSlots: DEFAULT_TIME_SLOTS,
    defaultDuration: DEFAULT_DURATION,
    blockedDates: [],
    customSlots: DATE_SPECIFIC_SLOTS as Record<string, { slots: string[]; duration: number }>,
  });
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editSlots, setEditSlots] = useState<string[]>([]);
  const [editDuration, setEditDuration] = useState(50);
  const [newSlotTime, setNewSlotTime] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchScheduleConfig();
  }, []);

  const fetchScheduleConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/schedule`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveScheduleConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ config }),
        }
      );

      if (response.ok) {
        alert('Schedule saved successfully!');
      } else {
        alert('Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(selectedWeek);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateKey = (date: Date) => {
    return `${date.getMonth() + 1}-${date.getDate()}`;
  };

  const getTimeSlotsForDateKey = (dateKey: string) => {
    const custom = config.customSlots[dateKey];
    if (custom?.slots) return custom.slots;
    return config.defaultSlots;
  };

  const getDurationForDateKey = (dateKey: string) => {
    const custom = config.customSlots[dateKey];
    if (custom?.duration) return custom.duration;
    return config.defaultDuration;
  };

  const isDateBlocked = (dateKey: string) => {
    return config.blockedDates.includes(dateKey);
  };

  const toggleWorkingDay = (dayId: number) => {
    setConfig((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayId)
        ? prev.workingDays.filter((d) => d !== dayId)
        : [...prev.workingDays, dayId].sort(),
    }));
  };

  const startEditing = (dateKey: string) => {
    setEditingDate(dateKey);
    setEditSlots(getTimeSlotsForDateKey(dateKey));
    setEditDuration(getDurationForDateKey(dateKey));
    setNewSlotTime('');
  };

  const addSlot = () => {
    if (newSlotTime && !editSlots.includes(newSlotTime)) {
      setEditSlots([...editSlots, newSlotTime].sort());
      setNewSlotTime('');
    }
  };

  const removeSlot = (time: string) => {
    setEditSlots(editSlots.filter((t) => t !== time));
  };

  const saveCustomSlots = () => {
    if (!editingDate) return;

    setConfig((prev) => ({
      ...prev,
      customSlots: {
        ...prev.customSlots,
        [editingDate]: { slots: editSlots, duration: editDuration },
      },
    }));
    setEditingDate(null);
  };

  const resetToDefault = () => {
    if (!editingDate) return;

    setConfig((prev) => {
      const newCustomSlots = { ...prev.customSlots };
      delete newCustomSlots[editingDate];
      return { ...prev, customSlots: newCustomSlots };
    });
    setEditingDate(null);
  };

  const toggleBlockDate = (dateKey: string) => {
    setConfig((prev) => ({
      ...prev,
      blockedDates: prev.blockedDates.includes(dateKey)
        ? prev.blockedDates.filter((d) => d !== dateKey)
        : [...prev.blockedDates, dateKey],
    }));
  };

  const addBlockedDate = () => {
    if (blockDate) {
      const date = new Date(blockDate);
      const dateKey = `${date.getMonth() + 1}-${date.getDate()}`;
      if (!config.blockedDates.includes(dateKey)) {
        setConfig((prev) => ({
          ...prev,
          blockedDates: [...prev.blockedDates, dateKey],
        }));
      }
      setBlockDate('');
      setShowBlockModal(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeek((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const weekDates = getWeekDates();

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#6b5949] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Working Days */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8dfd8] p-4">
        <h3 className="font-medium text-[#3d2f28] mb-3">Working Days</h3>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.id}
              onClick={() => toggleWorkingDay(day.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                config.workingDays.includes(day.id)
                  ? 'bg-[#6b5949] text-white'
                  : 'bg-[#f5f0ed] text-[#8b7764] hover:bg-[#e8dfd8]'
              }`}
            >
              {day.short}
            </button>
          ))}
        </div>
      </div>

      {/* Default Time Slots */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8dfd8] p-4">
        <h3 className="font-medium text-[#3d2f28] mb-3">Default Time Slots</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {config.defaultSlots.map((time) => (
            <span
              key={time}
              className="px-3 py-1.5 bg-[#f5f0ed] rounded-lg text-sm text-[#3d2f28]"
            >
              {time}
            </span>
          ))}
        </div>
        <p className="text-sm text-[#8b7764]">
          Duration: {config.defaultDuration} minutes per session
        </p>
      </div>

      {/* Week View */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8dfd8]">
        <div className="flex items-center justify-between p-4 border-b border-[#e8dfd8]">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-[#f5f0ed] rounded-lg"
          >
            <ChevronLeft className="w-5 h-5 text-[#6b5949]" />
          </button>
          <h3 className="font-medium text-[#3d2f28]">
            Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h3>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-[#f5f0ed] rounded-lg"
          >
            <ChevronRight className="w-5 h-5 text-[#6b5949]" />
          </button>
        </div>

        <div className="divide-y divide-[#e8dfd8]">
          {weekDates.map((date) => {
            const dateKey = formatDateKey(date);
            const dayOfWeek = date.getDay() === 0 ? 0 : date.getDay();
            const isWorkingDay = config.workingDays.includes(dayOfWeek);
            const blocked = isDateBlocked(dateKey);
            const hasCustomSlots = !!config.customSlots[dateKey];
            const slots = getTimeSlotsForDateKey(dateKey);

            return (
              <div
                key={dateKey}
                className={`p-4 ${blocked ? 'bg-red-50/50' : !isWorkingDay ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`font-medium ${blocked ? 'text-red-600' : 'text-[#3d2f28]'}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    {blocked && (
                      <span className="text-xs text-red-500">BLOCKED</span>
                    )}
                    {hasCustomSlots && !blocked && (
                      <span className="text-xs text-[#6b5949]">Custom schedule</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isWorkingDay && !blocked && (
                      <button
                        onClick={() => startEditing(dateKey)}
                        className="p-2 hover:bg-[#f5f0ed] rounded-lg text-[#6b5949]"
                        title="Edit slots"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleBlockDate(dateKey)}
                      className={`p-2 rounded-lg transition-colors ${
                        blocked
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'hover:bg-red-100 text-red-500'
                      }`}
                      title={blocked ? 'Unblock' : 'Block'}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isWorkingDay && !blocked && (
                  <div className="flex flex-wrap gap-1">
                    {slots.map((time) => (
                      <span
                        key={time}
                        className="px-2 py-1 bg-[#f5f0ed] rounded text-xs text-[#6b5949]"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8dfd8] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-[#3d2f28]">Blocked Dates</h3>
          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#6b5949] text-white rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        {config.blockedDates.length === 0 ? (
          <p className="text-sm text-[#8b7764]">No blocked dates</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {config.blockedDates.map((dateKey) => (
              <span
                key={dateKey}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm"
              >
                {dateKey}
                <button
                  onClick={() => toggleBlockDate(dateKey)}
                  className="hover:text-red-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={saveScheduleConfig}
        disabled={isSaving}
        className="w-full py-3 bg-[#6b5949] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#5a4838] disabled:opacity-50"
      >
        <Save className="w-5 h-5" />
        {isSaving ? 'Saving...' : 'Save Schedule'}
      </button>

      {/* Edit Slots Modal */}
      {editingDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-4 border-b border-[#e8dfd8]">
              <h3 className="font-medium text-[#3d2f28]">Edit Time Slots</h3>
              <p className="text-sm text-[#8b7764]">
                Customize slots for {editingDate}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Duration */}
              <div>
                <label className="text-sm text-[#6b5949] mb-1 block">Session Duration</label>
                <select
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#f5f0ed] rounded-lg text-[#3d2f28] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                >
                  <option value={45}>45 minutes</option>
                  <option value={50}>50 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              {/* Time Slots */}
              <div>
                <label className="text-sm text-[#6b5949] mb-1 block">Time Slots</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editSlots.map((time) => (
                    <span
                      key={time}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#f5f0ed] rounded-lg text-sm"
                    >
                      {time}
                      <button onClick={() => removeSlot(time)}>
                        <X className="w-3 h-3 text-[#8b7764]" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#f5f0ed] rounded-lg text-[#3d2f28] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                  />
                  <button
                    onClick={addSlot}
                    className="px-4 py-2 bg-[#6b5949] text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#e8dfd8] flex gap-2">
              <button
                onClick={resetToDefault}
                className="flex-1 py-2.5 rounded-lg bg-[#f5f0ed] text-[#6b5949] font-medium hover:bg-[#e8dfd8]"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setEditingDate(null)}
                className="py-2.5 px-4 rounded-lg border border-[#e8dfd8] text-[#6b5949] font-medium hover:bg-[#f5f0ed]"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomSlots}
                className="flex-1 py-2.5 rounded-lg bg-[#6b5949] text-white font-medium hover:bg-[#5a4838]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-4 border-b border-[#e8dfd8]">
              <h3 className="font-medium text-[#3d2f28]">Block a Date</h3>
              <p className="text-sm text-[#8b7764]">
                No bookings will be allowed on this date
              </p>
            </div>

            <div className="p-4">
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#f5f0ed] rounded-lg text-[#3d2f28] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
              />
            </div>

            <div className="p-4 border-t border-[#e8dfd8] flex gap-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-[#f5f0ed] text-[#6b5949] font-medium hover:bg-[#e8dfd8]"
              >
                Cancel
              </button>
              <button
                onClick={addBlockedDate}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600"
              >
                Block Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
