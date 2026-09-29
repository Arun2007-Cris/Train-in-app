import React, { useState } from 'react';
import {
  X,
  Bell,
  BellRing,
  Check,
  Clock,
  Sparkles,
  Trash2,
  ArrowRight,
  Ticket,
  MapPin,
  Copy,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  User,
  Users,
  Train
} from 'lucide-react';
import { TrainNotification, Booking } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: TrainNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onSimulate: (type: 'approaching' | 'arrival' | 'destination') => void;
  onViewTicket?: (ticket: Booking) => void;
  onTrackTrain?: (ticket: Booking) => void;
  onRefreshBackend?: () => Promise<void> | void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onDismiss,
  onClearAll,
  onSimulate,
  onViewTicket,
  onTrackTrain,
  onRefreshBackend,
}) => {
  const [copiedPnr, setCopiedPnr] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleCopyPnr = (pnr: string) => {
    navigator.clipboard.writeText(pnr);
    setCopiedPnr(pnr);
    setTimeout(() => setCopiedPnr(null), 2500);
  };

  const handleRefresh = async () => {
    if (!onRefreshBackend) return;
    setIsRefreshing(true);
    try {
      await onRefreshBackend();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-sm">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">Live Train Alerts</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Backend Synced
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Demo e-tickets & real-time route alerts
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              {onRefreshBackend && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Refresh from Backend Database"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Close Alerts"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Simulation Test Controls for Examiners */}
          <div className="my-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3" />
              Examiner & Live Test Triggers
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => onSimulate('approaching')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-left transition flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">Approaching Alert</span>
                <ArrowRight className="w-3 h-3 text-amber-400 shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => onSimulate('arrival')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-left transition flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">Train Arrived</span>
                <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => onSimulate('destination')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-left transition flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">Destination Near</span>
                <ArrowRight className="w-3 h-3 text-blue-400 shrink-0 ml-1" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">
                Recent Alerts & Tickets ({notifications.length})
              </span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-slate-500 hover:text-rose-400 text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No active alerts</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Book a train to receive your official Demo Ticket here, or use the triggers above.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isTicket = n.type === 'ticket' || !!n.ticket;
                const isArrival = n.type === 'arrival';
                const isDest = n.type === 'destination';
                const ticket = n.ticket;

                return (
                  <div
                    key={n.id}
                    className={`rounded-2xl border transition relative p-4 ${
                      isTicket
                        ? 'bg-gradient-to-b from-amber-500/15 to-slate-950 border-amber-500/50 shadow-xl shadow-amber-500/5'
                        : isArrival
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                        : isDest
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {isTicket ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <Ticket className="w-4 h-4" />
                          </div>
                        ) : (
                          <span className="text-base">🔔</span>
                        )}
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>{n.title}</span>
                            {isTicket && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Stored in Backend
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {n.timestamp}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDismiss(n.id)}
                        className="text-slate-500 hover:text-slate-200 p-1 transition cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Summary Message */}
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {n.message}
                    </p>

                    {/* EMBEDDED DEMO TICKET CONTAINER */}
                    {isTicket && ticket && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30 shadow-inner text-slate-200 space-y-3">
                        {/* Ticket Sub-header / PNR Barcode simulation */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center space-x-2">
                            <Train className="w-4 h-4 text-amber-400" />
                            <div>
                              <span className="text-xs font-bold text-white block">
                                {ticket.train_name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{ticket.train_number} • {ticket.travel_class}
                              </span>
                            </div>
                          </div>

                          {/* PNR with Copy */}
                          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">PNR:</span>
                            <span className="text-xs font-black font-mono text-amber-400">
                              {ticket.pnr}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPnr(ticket.pnr)}
                              className="text-slate-400 hover:text-white p-0.5 ml-0.5 transition cursor-pointer"
                              title="Copy PNR"
                            >
                              {copiedPnr === ticket.pnr ? (
                                <CheckCheck className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Route Corridor */}
                        <div className="flex items-center justify-between text-xs py-1">
                          <div>
                            <span className="text-[10px] text-amber-400 uppercase font-bold block">Boarding</span>
                            <span className="font-bold text-white text-sm">
                              {ticket.boarding_station_code || ticket.boarding_station}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {ticket.departure_time}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col items-center px-2">
                            <span className="text-[9px] text-slate-500 font-mono">
                              {ticket.journey_duration || 'Express Corridor'}
                            </span>
                            <div className="w-full flex items-center my-0.5 relative max-w-[100px]">
                              <div className="h-[1px] w-full bg-slate-700" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px]">➔</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-400">
                              {ticket.booking_status}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 uppercase font-bold block">Destination</span>
                            <span className="font-bold text-white text-sm">
                              {ticket.destination_station_code || ticket.destination_station}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {ticket.arrival_time}
                            </span>
                          </div>
                        </div>

                        {/* Coach, Berth & Passenger Details */}
                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Coach & Berth</span>
                            <span className="font-mono font-bold text-amber-300">
                              Coach {ticket.coach} • {ticket.seat_berth || ticket.berth_number}
                            </span>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Fare Paid</span>
                            <span className="font-mono font-black text-emerald-400">
                              ₹{ticket.total_fare || ticket.fare}
                            </span>
                          </div>
                        </div>

                        {/* Passenger(s) Banner */}
                        <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                          <div className="flex items-center space-x-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold text-white truncate">
                              {ticket.passenger_name || ticket.passenger?.name || 'Passenger'}
                            </span>
                            {(ticket.passenger_count || ticket.passengers?.length || 1) > 1 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-amber-400 font-bold">
                                +{(ticket.passenger_count || ticket.passengers?.length || 1) - 1} more
                              </span>
                            )}
                          </div>
                          {(ticket.masked_aadhaar || ticket.passenger?.masked_aadhaar) && (
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              {ticket.masked_aadhaar || ticket.passenger?.masked_aadhaar}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons right inside notification */}
                        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                          {onViewTicket && (
                            <button
                              type="button"
                              onClick={() => onViewTicket(ticket)}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>View Full Ticket</span>
                            </button>
                          )}

                          {onTrackTrain && (
                            <button
                              type="button"
                              onClick={() => onTrackTrain(ticket)}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span>Track Live</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Integrated Backend Ticket & Notification Store • College Prototype
        </div>
      </div>
    </div>
  );
};
