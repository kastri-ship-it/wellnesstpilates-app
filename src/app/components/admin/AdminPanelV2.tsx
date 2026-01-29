import { useState, useEffect } from 'react';
import {
  Calendar, Users, Clock, ListTodo, MoreHorizontal, LogOut, Settings,
  TrendingUp, DollarSign, UserCheck
} from 'lucide-react';
import { logo } from '../../../assets/images';
import { TodayDashboard } from './TodayDashboard';
import { ClassesView } from './ClassesView';
import { UsersView } from './UsersView';
import { ScheduleView } from './ScheduleView';
import { WaitlistView } from './WaitlistView';
import { MoreMenu } from './MoreMenu';

type Tab = 'today' | 'classes' | 'users' | 'schedule' | 'waitlist';

type AdminPanelV2Props = {
  onLogout: () => void;
};

export function AdminPanelV2({ onLogout }: AdminPanelV2Props) {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'classes', label: 'Classes', icon: <Calendar className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'schedule', label: 'Schedule', icon: <Clock className="w-5 h-5" /> },
    { id: 'waitlist', label: 'Waitlist', icon: <ListTodo className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-[#f5f0ed]">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <div>
            <h1 className="text-base font-medium text-[#3d2f28]">WellNest Admin</h1>
            <p className="text-xs text-[#8b7764]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMoreMenu(true)}
            className="p-2 hover:bg-[#f5f0ed] rounded-lg transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-5 h-5 text-[#6b5949]" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'today' && <TodayDashboard onNavigate={setActiveTab} />}
        {activeTab === 'classes' && <ClassesView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'schedule' && <ScheduleView />}
        {activeTab === 'waitlist' && <WaitlistView />}
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8dfd8] shadow-lg z-30">
        <div className="flex justify-around items-center py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'text-[#6b5949]'
                  : 'text-[#8b7764] hover:text-[#6b5949]'
              }`}
            >
              <div className={`${activeTab === tab.id ? 'scale-110' : ''} transition-transform`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] ${activeTab === tab.id ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-[#6b5949] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <MoreMenu onClose={() => setShowMoreMenu(false)} onLogout={onLogout} />
      )}
    </div>
  );
}
