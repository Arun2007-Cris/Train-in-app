import React, { useState } from 'react';
import {
  X,
  Train,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Ticket,
  Calendar,
  Navigation,
  Sparkles,
  Layers,
  ArrowRight,
  GitFork
} from 'lucide-react';
import { SearchResultTrain, TrainStop } from '../types';
import { VerticalRouteTracker } from './VerticalRouteTracker';
import { formatSegmentDate } from '../utils/dateUtils';

interface TrainDetailsModalProps {
  train: SearchResultTrain;
  journeyDate?: string;
  onClose: () => void;
  onBook: (train: SearchResultTrain) => void;
  onOpenVerticalLive?: (train: SearchResultTrain) => void;
  onOpenCopilot?: () => void;
  onOpenConnectingFinder?: (stationCode: string) => void;
}

export const TrainDetailsModal: React.FC<TrainDetailsModalProps> = ({
  train,
  journeyDate,
  onClose,
  onBook,
  onOpenVerticalLive,
  onOpenCopilot,
  onOpenConnectingFinder,
}) => {
  const [activeTab, setActiveTab] = useState<'vertical_location' | 'classes_fares'>('vertical_location');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Train className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400">
                  #{train.train_number}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {train.train_type}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Vertical Location Active
                </span>
                {train.is_overnight && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Overnight Service
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {train.train_name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Route: {train.source} ({train.source_code}) ➔ {train.destination} ({train.destination_code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pt-3 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('vertical_location')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                activeTab === 'vertical_location'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Vertical Live Route & Location</span>
            </button>

            <button
              onClick={() => setActiveTab('classes_fares')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                activeTab === 'classes_fares'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Classes, Fares & Timetable</span>
            </button>
          </div>

          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Copilot</span>
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Quick Departure & Arrival Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="text-left font-mono">
                <span className="text-[10px] uppercase font-bold text-amber-400 block font-sans">
                  Boarding Departure
                </span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {train.departure_time}
                </span>
                <span className="text-xs font-bold text-amber-300 block truncate max-w-[180px]">
                  {train.boarding_stop.station_name} ({train.boarding_stop.station_code})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-t sm:border-t-0 sm:border-x border-slate-800 pt-2 sm:pt-0 sm:px-6 w-full sm:w-auto justify-between sm:justify-center">
              <div className="text-center">
                <span className="text-slate-200 font-bold block">{train.journey_duration}</span>
                <span className="text-amber-400 block">{train.journey_distance_km} km</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:text-right">
              <div className="font-mono">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block font-sans">
                  Destination Arrival
                </span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {train.arrival_time}
                </span>
                <span className="text-xs font-bold text-emerald-300 block truncate max-w-[180px]">
                  {train.destination_stop.station_name} ({train.destination_stop.station_code})
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: VERTICAL LIVE ROUTE & LOCATION TRACKER */}
          {activeTab === 'vertical_location' ? (
            <VerticalRouteTracker
              train={train}
              boardingCode={train.boarding_stop.station_code}
              destinationCode={train.destination_stop.station_code}
              journeyDate={journeyDate}
              onOpenCopilot={onOpenCopilot}
              onOpenConnectingFinder={onOpenConnectingFinder}
            />
          ) : (
            /* TAB 2: CLASSES, FARES & FULL TIMETABLE */
            <div className="space-y-6">
              {/* Available Classes & Pricing Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                  <span>Available Classes & Demo Fares</span>
                  <span className="text-[11px] text-amber-400/90 font-normal">
                    Pro-rated for {train.journey_distance_km} km
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {train.calculated_classes.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">
                          {c.class_name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Seats: <strong className="text-emerald-400">{c.available_seats} Available</strong>
                        </span>
                      </div>
                      <div className="mt-2 text-lg font-black font-mono text-amber-400">
                        ₹{c.fare}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Station Timetable Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Full Route Timetable ({train.stops.length} Stations)
                </h3>
                <div className="rounded-2xl border border-slate-800 overflow-x-auto bg-slate-950 shadow-inner">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Station</th>
                        <th className="py-2.5 px-3">Arrival</th>
                        <th className="py-2.5 px-3">Departure</th>
                        <th className="py-2.5 px-3">Distance</th>
                        <th className="py-2.5 px-3">Date & Day</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {train.stops.map((stop) => {
                        const isBoarding = stop.station_code === train.boarding_stop.station_code;
                        const isDest = stop.station_code === train.destination_stop.station_code;
                        const isCurrent = stop.station_code === train.live_status.current_station_code;
                        const stopDate = formatSegmentDate(journeyDate, stop.day_offset || 0, false);

                        return (
                          <tr
                            key={stop.station_order}
                            className={`hover:bg-slate-900/60 transition ${
                              isCurrent
                                ? 'bg-amber-500/10 text-amber-200 font-bold'
                                : isBoarding
                                ? 'bg-amber-500/5 text-amber-300 font-bold'
                                : isDest
                                ? 'bg-emerald-500/5 text-emerald-300 font-bold'
                                : 'text-slate-300'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-slate-500">{stop.station_order}</td>
                            <td className="py-2.5 px-3 font-sans font-medium">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-amber-400">
                                  {stop.station_code}
                                </span>
                                <span>{stop.station_name}</span>
                                {isBoarding && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                                    Boarding
                                  </span>
                                )}
                                {isDest && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold">
                                    Destination
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-bold animate-pulse">
                                    🚆 Train Here
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">{stop.arrival_time || '--'}</td>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">{stop.departure_time || '--'}</td>
                            <td className="py-2.5 px-3 text-slate-400">{stop.distance_km} km</td>
                            <td className="py-2.5 px-3 text-slate-300 font-sans text-[11px]">
                              <span className="text-amber-400/90 font-medium font-mono">{stopDate}</span>
                              <span className="text-slate-500 ml-1 text-[10px]">(Day {(stop.day_offset || 0) + 1})</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">Live GPS Telemetry:</span>
            <span>Positioned at {train.live_status.current_station} ({train.live_status.speed} km/h)</span>
          </div>

          <button
            onClick={() => {
              onBook(train);
              onClose();
            }}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>Select Class & Book Train (From ₹{train.base_fare})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
