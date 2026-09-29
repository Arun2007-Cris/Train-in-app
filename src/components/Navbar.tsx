import React from 'react';
import { Train, Bell, User as UserIcon, ShieldAlert, LogOut, Search, MapPin, Sparkles, Ticket } from 'lucide-react';
import { User, Passenger } from '../types';

interface NavbarProps {
  user: User | null;
  passenger: Passenger | null;
  passengersCount?: number;
  activeStep: string;
  hasBooking?: boolean;
  onNavigate: (step: any) => void;
  onLogout: () => void;
  unreadCount: number;
  onToggleNotifications: () => void;
  onOpenCopilot?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  passenger,
  passengersCount = 1,
  activeStep,
  hasBooking,
  onNavigate,
  onLogout,
  unreadCount,
  onToggleNotifications,
  onOpenCopilot,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & College Prototype Badge */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('journey')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center">
                TRAIN IN APP
                <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-1.5 inline animate-pulse" />
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                AI Powered
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">Smart Railway & Live Location System</p>
          </div>
        </div>

        {/* Quick Navigation breadcrumb or status */}
        <div className="hidden md:flex items-center space-x-1 text-xs">
          <button
            onClick={() => onNavigate('journey')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeStep === 'journey' || activeStep === 'recommendations'
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & Trains</span>
          </button>

          {passenger && (
            <button
              onClick={() => onNavigate('passenger')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                activeStep === 'passenger'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>
                {passengersCount > 1
                  ? `Passengers (${passengersCount} Persons)`
                  : `Passenger: ${passenger.name}`}
              </span>
            </button>
          )}

          {hasBooking && (
            <button
              onClick={() => onNavigate('ticket')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                activeStep === 'ticket'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-amber-400" />
              <span>My Ticket</span>
            </button>
          )}
        </div>

        {/* Right side controls: Notification & Profile */}
        <div className="flex items-center space-x-2.5">
          {/* Simulated Disclaimer badge */}
          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
            Live Demo System
          </div>

          {/* AI Copilot Button */}
          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className="p-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition flex items-center space-x-1 text-xs font-bold cursor-pointer"
              title="Open Railway AI Copilot"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>
          )}

          {/* Notification Bell with Badge */}
          <button
            onClick={onToggleNotifications}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Train Notifications & Live Alerts"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-200">{passenger?.name || user.name || user.email.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
