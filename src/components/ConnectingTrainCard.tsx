import React, { useState } from 'react';
import {
  Train,
  Clock,
  ArrowRight,
  Sparkles,
  GitFork,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Ticket,
  MapPin,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Bed,
  Scale,
  Hotel
} from 'lucide-react';
import { ConnectingTrainRoute, SearchResultTrain } from '../types';
import { computeConnectingRouteDates } from '../utils/dateUtils';

interface ConnectingTrainCardProps {
  route: ConnectingTrainRoute;
  journeyDate?: string;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (route: ConnectingTrainRoute) => void;
  onCompareWithAI?: (route: ConnectingTrainRoute) => void;
  onOpenHotels?: (route: ConnectingTrainRoute) => void;
  onBook: (route: ConnectingTrainRoute) => void;
  onViewConnectedRoute: (route: ConnectingTrainRoute) => void;
  onOpenCopilot?: (route?: ConnectingTrainRoute) => void;
}

export const ConnectingTrainCard: React.FC<ConnectingTrainCardProps> = ({
  route,
  journeyDate,
  isSelectedForCompare = false,
  onToggleCompare,
  onCompareWithAI,
  onOpenHotels,
  onBook,
  onViewConnectedRoute,
  onOpenCopilot,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const dates = computeConnectingRouteDates(
    journeyDate,
    route.leg1.departure_time,
    route.leg1.arrival_time,
    route.leg1.boarding_stop?.day_offset || 0,
    route.layover_minutes,
    route.leg2.journey_duration_minutes
  );

  const leg1HasSleeper = route.leg1.calculated_classes?.some(
    (c) => c.class_name === 'Sleeper' || c.class_name.toLowerCase().includes('sleeper') || c.class_name.includes('SL')
  );
  const leg2HasSleeper = route.leg2.calculated_classes?.some(
    (c) => c.class_name === 'Sleeper' || c.class_name.toLowerCase().includes('sleeper') || c.class_name.includes('SL')
  );

  const getTrainTypeBadge = (type: string) => {
    switch (type) {
      case 'Vande Bharat':
        return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'Superfast':
        return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
      case 'Express':
        return 'bg-amber-600/20 text-amber-300 border-amber-500/30';
      case 'Rajdhani':
        return 'bg-rose-600/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-xl transition-all duration-200">
      {/* Top Bar: Badges & Combined Cost / Duration */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <GitFork className="w-4 h-4 rotate-90" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Connecting Route
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Via {route.junction_station_code}
              </span>
              {(leg1HasSleeper || leg2HasSleeper) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Bed className="w-3 h-3" />
                  Sleeper (SL) Available
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Interchange transfer at <span className="text-slate-200 font-semibold">{route.junction_station_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(route)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isSelectedForCompare
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isSelectedForCompare ? 'Selected' : 'Compare'}</span>
            </button>
          )}

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Combined Fare</span>
            <span className="text-lg font-black text-amber-400 font-mono">₹{route.total_base_fare}</span>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Journey</span>
            <span className="text-sm font-bold text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {route.total_duration}
            </span>
          </div>
        </div>
      </div>

      {/* Main Connected Route Visualizer with Segment Dates */}
      <div className="my-5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Leg 1 Box */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Leg 1 • First Train
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTrainTypeBadge(route.leg1.train_type)}`}>
                {route.leg1.train_type}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-300">
              #{route.leg1.train_number}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white truncate mb-2">
            {route.leg1.train_name}
          </h4>

          <div className="flex items-center justify-between text-xs">
            {/* Leg 1 Departure with Date */}
            <div>
              <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-semibold mb-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{dates.leg1ShortDepDate}</span>
              </div>
              <span className="text-base font-black text-white font-mono">{route.leg1.departure_time}</span>
              <p className="text-slate-400 font-medium">{route.leg1.boarding_stop.station_code}</p>
            </div>

            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 block font-mono">
                {route.leg1.journey_duration}
              </span>
              <div className="w-16 h-0.5 bg-slate-700 my-1 relative">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute right-0 -top-0.5" />
              </div>
              <span className="text-[9px] text-slate-500 block">{route.leg1.journey_distance_km} km</span>
            </div>

            {/* Leg 1 Arrival with Date */}
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1 text-[10px] text-amber-400 font-semibold mb-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{dates.leg1ShortArrDate}</span>
              </div>
              <span className="text-base font-black text-white font-mono">{route.leg1.arrival_time}</span>
              <p className="text-slate-400 font-medium">{route.leg1.destination_stop.station_code}</p>
            </div>
          </div>
        </div>

        {/* Junction Transfer Hub Centerpiece */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 text-center bg-slate-800/40 rounded-2xl border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/20 mb-1">
            <GitFork className="w-4 h-4 rotate-90" />
          </div>
          <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
            Transfer Hub
          </span>
          <span className="text-xs font-extrabold text-white mt-0.5">
            {route.junction_station_code}
          </span>
          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono mt-1">
            <Calendar className="w-2.5 h-2.5 text-amber-400" />
            <span>{dates.transferDate}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-700 mt-1">
            {route.layover_duration} buffer
          </span>
        </div>

        {/* Leg 2 Box */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Leg 2 • Connecting Train
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTrainTypeBadge(route.leg2.train_type)}`}>
                {route.leg2.train_type}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-300">
              #{route.leg2.train_number}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white truncate mb-2">
            {route.leg2.train_name}
          </h4>

          <div className="flex items-center justify-between text-xs">
            {/* Leg 2 Departure with Date */}
            <div>
              <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold mb-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{dates.leg2ShortDepDate}</span>
              </div>
              <span className="text-base font-black text-white font-mono">{route.leg2.departure_time}</span>
              <p className="text-slate-400 font-medium">{route.leg2.boarding_stop.station_code}</p>
            </div>

            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 block font-mono">
                {route.leg2.journey_duration}
              </span>
              <div className="w-16 h-0.5 bg-slate-700 my-1 relative">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute right-0 -top-0.5" />
              </div>
              <span className="text-[9px] text-slate-500 block">{route.leg2.journey_distance_km} km</span>
            </div>

            {/* Leg 2 Arrival with Date */}
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-400 font-semibold mb-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{dates.leg2ShortArrDate}</span>
              </div>
              <span className="text-base font-black text-white font-mono">{route.leg2.arrival_time}</span>
              <p className="text-slate-400 font-medium">{route.leg2.destination_stop.station_code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Guidance & AI Reason */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">Transfer Advice: </span>
            {route.layover_advice}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {route.ai_tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
            >
              {tag}
            </span>
          ))}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {route.ai_score}% AI Score
          </span>
        </div>
      </div>

      {/* Accordion Toggle for Detailed Halts and Segment Timetable with Dates */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Leg 1 Detailed Segment */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-black text-amber-400">
                  Leg 1: {route.leg1.train_name} (#{route.leg1.train_number})
                </h5>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTrainTypeBadge(route.leg1.train_type)}`}>
                  {route.leg1.train_type}
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Departure:</span>
                  <span className="font-mono text-white font-bold">{dates.leg1DepDate}, {route.leg1.departure_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Arrival at Junction:</span>
                  <span className="font-mono text-white font-bold">{dates.leg1ArrDate}, {route.leg1.arrival_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Distance & Duration:</span>
                  <span className="font-mono text-slate-300">{route.leg1.journey_distance_km} km • {route.leg1.journey_duration}</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Available Classes & Sleeper:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {route.leg1.calculated_classes.map((cls, i) => (
                  <span
                    key={i}
                    className={`text-[10px] px-2 py-1 rounded font-medium border ${
                      cls.class_name === 'Sleeper' || cls.class_name.includes('SL')
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {cls.class_name}: <strong className="text-amber-400 font-mono">₹{cls.fare}</strong> ({cls.available_seats} seats)
                  </span>
                ))}
              </div>
            </div>

            {/* Leg 2 Detailed Segment */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-black text-emerald-400">
                  Leg 2: {route.leg2.train_name} (#{route.leg2.train_number})
                </h5>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTrainTypeBadge(route.leg2.train_type)}`}>
                  {route.leg2.train_type}
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Departure from Junction:</span>
                  <span className="font-mono text-white font-bold">{dates.leg2DepDate}, {route.leg2.departure_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Destination Arrival:</span>
                  <span className="font-mono text-white font-bold">{dates.leg2ArrDate}, {route.leg2.arrival_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Distance & Duration:</span>
                  <span className="font-mono text-slate-300">{route.leg2.journey_distance_km} km • {route.leg2.journey_duration}</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Available Classes & Sleeper:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {route.leg2.calculated_classes.map((cls, i) => (
                  <span
                    key={i}
                    className={`text-[10px] px-2 py-1 rounded font-medium border ${
                      cls.class_name === 'Sleeper' || cls.class_name.includes('SL')
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {cls.class_name}: <strong className="text-amber-400 font-mono">₹{cls.fare}</strong> ({cls.available_seats} seats)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer Buttons */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer transition"
        >
          <span>{isExpanded ? 'Hide Segment Details' : 'View Segment Details & Timetable'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenHotels && (
            <button
              type="button"
              onClick={() => onOpenHotels(route)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Suggest hotels, apartments and IRCTC sleeping pods at transfer station"
            >
              <Hotel className="w-3.5 h-3.5" />
              <span>🏨 AI Hotels/Pods</span>
            </button>
          )}

          {onCompareWithAI && (
            <button
              type="button"
              onClick={() => onCompareWithAI(route)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
              title="Compare connecting routes with Advanced AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Compare</span>
            </button>
          )}

          {onOpenCopilot && (
            <button
              type="button"
              onClick={() => onOpenCopilot(route)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-amber-500/30 transition flex items-center space-x-1 cursor-pointer"
              title="Ask AI Copilot about this connecting route"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Copilot</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewConnectedRoute(route)}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            title="View vertical route showing both trains and junction transfer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Vertical Route Map</span>
          </button>

          <button
            type="button"
            onClick={() => onBook(route)}
            className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Book Connecting Ticket (₹{route.total_base_fare})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
