import React from 'react';
import {
  X,
  Train,
  Clock,
  MapPin,
  CheckCircle2,
  GitFork,
  ArrowRight,
  Sparkles,
  Ticket,
  Coffee,
  Info,
  Layers,
  Calendar
} from 'lucide-react';
import { ConnectingTrainRoute } from '../types';
import { formatSegmentDate, computeConnectingRouteDates } from '../utils/dateUtils';

interface ConnectedVerticalRouteTrackerProps {
  route: ConnectingTrainRoute;
  journeyDate?: string;
  onClose: () => void;
  onBook: (route: ConnectingTrainRoute) => void;
  onOpenCopilot?: (route?: ConnectingTrainRoute) => void;
}

export const ConnectedVerticalRouteTracker: React.FC<ConnectedVerticalRouteTrackerProps> = ({
  route,
  journeyDate,
  onClose,
  onBook,
  onOpenCopilot,
}) => {
  const dates = computeConnectingRouteDates(
    journeyDate,
    route.leg1.departure_time,
    route.leg1.arrival_time,
    route.leg1.boarding_stop?.day_offset || 0,
    route.layover_minutes,
    route.leg2.journey_duration_minutes
  );

  const leg1Stops = route.leg1.intermediate_stops && route.leg1.intermediate_stops.length > 0
    ? route.leg1.intermediate_stops
    : [route.leg1.boarding_stop, route.leg1.destination_stop];

  const leg2Stops = route.leg2.intermediate_stops && route.leg2.intermediate_stops.length > 0
    ? route.leg2.intermediate_stops
    : [route.leg2.boarding_stop, route.leg2.destination_stop];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <GitFork className="w-7 h-7 rotate-90" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Connected Route Vertical Tracker
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Via {route.junction_station_name} ({route.junction_station_code})
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  Layover: {route.layover_duration}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Dep: {dates.leg1ShortDepDate}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center gap-2">
                <span>{route.leg1.boarding_stop.station_name}</span>
                <span className="text-amber-400">➔</span>
                <span className="text-amber-400">{route.junction_station_code}</span>
                <span className="text-amber-400">➔</span>
                <span>{route.leg2.destination_stop.station_name}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 my-4 bg-slate-950 rounded-2xl border border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">First Leg (T1)</span>
            <span className="text-xs font-extrabold text-white">#{route.leg1.train_number} {route.leg1.train_type}</span>
            <span className="text-[10px] text-amber-400 block font-mono mt-0.5">{dates.leg1ShortDepDate}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Second Leg (T2)</span>
            <span className="text-xs font-extrabold text-white">#{route.leg2.train_number} {route.leg2.train_type}</span>
            <span className="text-[10px] text-emerald-400 block font-mono mt-0.5">{dates.leg2ShortDepDate}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Duration</span>
            <span className="text-xs font-extrabold text-amber-400">{route.total_duration}</span>
            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Arrival: {dates.leg2ShortArrDate}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Combined Fare</span>
            <span className="text-xs font-extrabold text-emerald-400">From ₹{route.total_base_fare}</span>
            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{route.ai_score}% AI Match</span>
          </div>
        </div>

        {/* Scrollable Connected Vertical Route Line */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* LEG 1 SECTION */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-amber-500/20">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/30">
                  1
                </span>
                <h4 className="text-sm font-black text-white">
                  Leg 1: {route.leg1.train_name} (#{route.leg1.train_number})
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {route.leg1.train_type}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {route.leg1.journey_distance_km} km • {route.leg1.journey_duration}
              </span>
            </div>

            {/* Vertical Stops Leg 1 with Segment Dates */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-1 before:bg-amber-500/40">
              {leg1Stops.map((stop, idx) => {
                const stopDate = formatSegmentDate(journeyDate, stop.day_offset || 0, false);
                return (
                  <div key={'leg1-' + stop.station_code + idx} className="relative">
                    <div className="absolute -left-[18px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-amber-400 bg-slate-900" />
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {stop.station_code}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {stop.station_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className="text-amber-400/90 font-mono font-medium flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {stopDate}
                          </span>
                          <span>•</span>
                          <span>Platform {stop.platform_number || (idx % 3) + 1}</span>
                          <span>•</span>
                          <span>{stop.distance_km} km</span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs text-slate-300">
                        <div className="text-amber-300 font-bold">Dep: {stop.departure_time || '--'}</div>
                        <div className="text-[10px] text-slate-500">Arr: {stop.arrival_time || '--'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INTERCHANGE JUNCTION HUB BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-800 to-amber-500/15 border-2 border-amber-500/40 shadow-xl my-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <GitFork className="w-5 h-5 rotate-90" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                      Interchange Station
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                      {route.layover_duration} Layover
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      {dates.transferDate}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {route.junction_station_name} ({route.junction_station_code})
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {route.layover_advice}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>Station Waiting Room & Refreshments Available</span>
              </div>
            </div>
          </div>

          {/* LEG 2 SECTION */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                  2
                </span>
                <h4 className="text-sm font-black text-white">
                  Leg 2: {route.leg2.train_name} (#{route.leg2.train_number})
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {route.leg2.train_type}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {route.leg2.journey_distance_km} km • {route.leg2.journey_duration}
              </span>
            </div>

            {/* Vertical Stops Leg 2 with Segment Dates */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-1 before:bg-emerald-500/40">
              {leg2Stops.map((stop, idx) => {
                const stopDate = formatSegmentDate(journeyDate, (route.leg1.boarding_stop?.day_offset || 0) + (stop.day_offset || 0), false);
                return (
                  <div key={'leg2-' + stop.station_code + idx} className="relative">
                    <div className="absolute -left-[18px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-emerald-400 bg-slate-900" />
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {stop.station_code}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {stop.station_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className="text-emerald-400/90 font-mono font-medium flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {stopDate}
                          </span>
                          <span>•</span>
                          <span>Platform {stop.platform_number || (idx % 3) + 1}</span>
                          <span>•</span>
                          <span>{stop.distance_km} km</span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs text-slate-300">
                        <div className="text-emerald-300 font-bold">Dep: {stop.departure_time || '--'}</div>
                        <div className="text-[10px] text-slate-500">Arr: {stop.arrival_time || '--'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          {onOpenCopilot && (
            <button
              onClick={() => onOpenCopilot(route)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI About This Connection</span>
            </button>
          )}

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => onBook(route)}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>Book Connecting Journey (₹{route.total_base_fare})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
