import React, { useEffect, useState } from 'react';
import { Train, Bell, X, ChevronRight, Ticket, AlertCircle } from 'lucide-react';
import { TrainNotification } from '../types';

interface MobilePushNotificationProps {
  notification: TrainNotification | null;
  onDismiss: () => void;
  onViewTicket?: (ticket: any) => void;
  onOpenNotifications?: () => void;
}

export const MobilePushNotification: React.FC<MobilePushNotificationProps> = ({
  notification,
  onDismiss,
  onViewTicket,
  onOpenNotifications,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for transition
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification || !isVisible) return null;

  const isTicket = notification.type === 'ticket' || !!notification.ticket;

  return (
    <aside
      aria-label="TrainInApp Mobile Notification"
      className="fixed top-3 inset-x-0 z-[100] mx-auto max-w-sm sm:max-w-md px-3 pointer-events-auto transition-all duration-300 ease-out transform translate-y-0"
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-white flex items-start gap-3 relative overflow-hidden ring-1 ring-amber-500/20">
        {/* Glowing accent bar */}
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

        {/* Smartphone-style App Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 mt-0.5">
          {isTicket ? <Ticket className="w-5 h-5" /> : <Train className="w-5 h-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span className="font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <span>TRAININAPP</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span>{notification.timestamp || 'Just Now'}</span>
            </span>
          </div>

          <h4 className="text-xs font-bold text-white truncate leading-snug">
            {notification.title}
          </h4>
          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
            {notification.message}
          </p>

          {/* Quick interactive action */}
          {isTicket && notification.ticket && onViewTicket && (
            <button
              onClick={() => {
                onViewTicket(notification.ticket);
                setIsVisible(false);
              }}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
            >
              <span>View E-Ticket & Track</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 250);
          }}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
