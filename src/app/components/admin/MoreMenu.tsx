import { useState } from 'react';
import {
  X, LogOut, BarChart3, Package, FileText, Settings, ChevronRight, Shield
} from 'lucide-react';

type MoreMenuProps = {
  onClose: () => void;
  onLogout: () => void;
};

type MenuSection = 'main' | 'analytics' | 'packages' | 'audit' | 'settings';

export function MoreMenu({ onClose, onLogout }: MoreMenuProps) {
  const [activeSection, setActiveSection] = useState<MenuSection>('main');

  const menuItems = [
    {
      id: 'analytics' as MenuSection,
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analytics',
      description: 'View booking stats',
    },
    {
      id: 'packages' as MenuSection,
      icon: <Package className="w-5 h-5" />,
      label: 'All Packages',
      description: 'Manage package types',
    },
    {
      id: 'audit' as MenuSection,
      icon: <FileText className="w-5 h-5" />,
      label: 'Audit Log',
      description: 'Activity history',
    },
    {
      id: 'settings' as MenuSection,
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      description: 'App configuration',
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'analytics':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[#3d2f28] mb-4">Analytics</h3>
            <div className="space-y-4">
              <div className="bg-[#f5f0ed] rounded-lg p-4">
                <p className="text-sm text-[#8b7764] mb-1">This Week</p>
                <p className="text-2xl font-bold text-[#3d2f28]">24 bookings</p>
              </div>
              <div className="bg-[#f5f0ed] rounded-lg p-4">
                <p className="text-sm text-[#8b7764] mb-1">This Month</p>
                <p className="text-2xl font-bold text-[#3d2f28]">87 bookings</p>
              </div>
              <div className="bg-[#f5f0ed] rounded-lg p-4">
                <p className="text-sm text-[#8b7764] mb-1">Revenue (Month)</p>
                <p className="text-2xl font-bold text-[#3d2f28]">43,500 DEN</p>
              </div>
              <p className="text-xs text-[#8b7764] text-center">
                Full analytics coming soon
              </p>
            </div>
          </div>
        );

      case 'packages':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[#3d2f28] mb-4">Package Types</h3>
            <div className="space-y-2">
              {[
                { name: 'Single Session', price: '600 DEN', sessions: 1 },
                { name: '8 Classes Package', price: '3,500 DEN', sessions: 8 },
                { name: '10 Classes Package', price: '4,200 DEN', sessions: 10 },
                { name: '12 Classes Package', price: '4,800 DEN', sessions: 12 },
                { name: 'Individual 1-on-1', price: '1,600 DEN', sessions: 1 },
                { name: 'DUO Session', price: '1,200 DEN', sessions: 1 },
              ].map((pkg, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-[#f5f0ed] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#3d2f28]">{pkg.name}</p>
                    <p className="text-sm text-[#8b7764]">{pkg.sessions} session{pkg.sessions > 1 ? 's' : ''}</p>
                  </div>
                  <p className="font-medium text-[#6b5949]">{pkg.price}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[#3d2f28] mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {[
                { action: 'Marked as paid', target: 'john@example.com', time: '5 min ago' },
                { action: 'Sent invite', target: 'jane@example.com', time: '12 min ago' },
                { action: 'Gifted 2 sessions', target: 'mike@example.com', time: '1 hour ago' },
                { action: 'Blocked date', target: '1-30', time: '2 hours ago' },
                { action: 'Updated schedule', target: '1-29', time: '3 hours ago' },
              ].map((log, i) => (
                <div
                  key={i}
                  className="p-3 bg-[#f5f0ed] rounded-lg"
                >
                  <p className="text-sm text-[#3d2f28]">{log.action}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-[#6b5949]">{log.target}</p>
                    <p className="text-xs text-[#8b7764]">{log.time}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-[#8b7764] text-center mt-4">
                Full audit log coming soon
              </p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-4">
            <h3 className="font-medium text-[#3d2f28] mb-4">Settings</h3>
            <div className="space-y-3">
              <div className="p-4 bg-[#f5f0ed] rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-[#6b5949]" />
                  <span className="font-medium text-[#3d2f28]">Admin Account</span>
                </div>
                <p className="text-sm text-[#8b7764]">Username: admin</p>
                <p className="text-sm text-[#8b7764]">Last login: Today</p>
              </div>

              <div className="p-4 bg-[#f5f0ed] rounded-lg">
                <p className="font-medium text-[#3d2f28] mb-2">Studio Info</p>
                <p className="text-sm text-[#8b7764]">WellNest Pilates</p>
                <p className="text-sm text-[#8b7764]">Gjuro Gjakovikj 59, Kumanovo</p>
                <p className="text-sm text-[#8b7764]">info@wellnestpilates.com</p>
              </div>

              <p className="text-xs text-[#8b7764] text-center">
                Version 2.0 - Admin Panel Rebuild
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="w-full flex items-center gap-3 p-4 bg-[#f5f0ed] rounded-lg hover:bg-[#e8dfd8] transition-colors text-left"
              >
                <div className="text-[#6b5949]">{item.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-[#3d2f28]">{item.label}</p>
                  <p className="text-sm text-[#8b7764]">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8b7764]" />
              </button>
            ))}

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-4 mt-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <p className="font-medium text-red-600">Logout</p>
                <p className="text-sm text-red-400">Sign out of admin panel</p>
              </div>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e8dfd8]">
          {activeSection !== 'main' ? (
            <button
              onClick={() => setActiveSection('main')}
              className="text-sm text-[#6b5949]"
            >
              Back
            </button>
          ) : (
            <span className="font-medium text-[#3d2f28]">More Options</span>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f5f0ed] rounded-lg"
          >
            <X className="w-5 h-5 text-[#6b5949]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
