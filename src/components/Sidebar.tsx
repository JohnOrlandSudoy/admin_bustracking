import React from 'react';
import { Bus, MapPin, Route, Bell, LogOut, User, Users, MessageSquare, List, UserPlus, UserCheck, FileText, Bookmark, Mail, Percent } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'buses', label: 'Buses', icon: Bus },
  { id: 'bus-list', label: 'Bus List', icon: List },
  { id: 'terminals', label: 'Terminals', icon: MapPin },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'contacts', label: 'Contacts', icon: Mail },
  { id: 'employee', label: 'Add Employee', icon: UserPlus },
  { id: 'confirm-employee', label: 'Confirm Employee', icon: UserCheck },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'bookings', label: 'Bookings', icon: Bookmark },
  { id: 'refunds', label: 'Refunds', icon: FileText },
  { id: 'discounts', label: 'Discounts', icon: Percent },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Redirect is handled by the protected route
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-pink-600 to-pink-700 text-white z-10 flex flex-col">
      <div className="p-6 flex-1">
        {/* Logo - served from public/AuroRide.jpg */}
        <div className="flex items-center mb-4">
          <img src="/AuroRide.jpg" alt="AuroRide" className="h-12 w-12 rounded-lg object-cover mr-3 shadow-md" />
          <h1 className="text-2xl font-bold">Auro Ride Admin</h1>
        </div>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white bg-opacity-20 shadow-lg'
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* User profile and logout section */}
      <div className="p-4 border-t border-pink-500 bg-pink-700 bg-opacity-30">
        {user && (
          <div className="flex items-center mb-3">
            <div className="bg-pink-200 text-pink-700 rounded-full p-1 mr-2">
              <User className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate">{user.username}</p>
              <p className="text-xs text-pink-200 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};
