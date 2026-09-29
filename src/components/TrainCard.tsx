import React from 'react';
import {
  Train as TrainIcon,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  Scale,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Zap,
  Calendar,
  Bed
} from 'lucide-react';
import { SearchResultTrain } from '../types';
import { HorizontalTrackPreview } from './HorizontalTrackPreview';
import { formatShortDate } from '../utils/dateUtils';

interface TrainCardProps {
  train: SearchResultTrain;
  boardingCode: string;
  destinationCode: string;
  journeyDate?: string;
  isCompared: boolean;
  onToggleCompare: (train: SearchResultTrain) => void;
  onViewDetails: (train: SearchResultTrain) => void;
  onBookTrain: (train: SearchResultTrain) => void;
}

export const TrainCard: React.FC<TrainCardProps> = ({
  train,
  boardingCode,
  destinationCode,
  journeyDate,
  isCompared,
  onToggleCompare,
  onViewDetails,
  onBookTrain,
}) => {
  // Category badge colors
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Vande Bharat':
        return 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-300 border-blue-500/40';
      case 'Tejas':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Rajdhani':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Superfast':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'MEMU':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const isDelayed = (train.live_status?.delay_minutes || 0) > 0;
  const hasSleeperClass = train.calculated_classes?.some(
    (c) => c.class_name === 'Sleeper' || c.class_name.toLowerCase().includes('sleeper') || c.class_name.includes('SL')
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-xl hover:shadow-2xl relative flex flex-col justify-between">
      {/* Top Banner: Train Number, Name, Type, and AI Score Badge */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
              <TrainIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-sm font-bold text-amber-400">
                  #{train.train_number}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getTypeColor(train.train_type)}`}>
                  {train.train_type}
                </span>
                {hasSleeperClass && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    Sleeper (SL)
                  </span>
                )}
                {train.is_overnight && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Overnight
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight mt-0.5">
                {train.train_name}
              </h3>
              <p className="text-[11px] text-slate-400">
                Route: {train.source} ({train.source_code}) → {train.destination} ({train.destination_code})
              </p>
            </div>
          </div>

          {/* AI Recommendation Score Chip */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400/90 block leading-none">
                  AI Match Score
                </span>
                <span className="text-base font-black text-amber-300 font-mono leading-none">
                  {train.ai_score}
                  <span className="text-xs text-amber-400/70 font-normal">/100</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Timing Grid with Dates */}
        <div className="grid grid-cols-3 gap-2 py-4 items-center">
          {/* Boarding Departure */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Departure
            </span>
            <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-semibold mt-0.5 font-mono">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{formatShortDate(journeyDate, train.boarding_stop?.day_offset || 0)}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
              {train.departure_time}
            </div>
            <div className="text-xs font-semibold text-amber-400 truncate">
              {train.boarding_stop.station_name}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Platform 2 • {boardingCode}
            </span>
          </div>

          {/* Duration & Halts Center Indicator */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {train.journey_duration}
            </span>
            <div className="w-full flex items-center my-1">
              <div className="h-0.5 w-full bg-slate-700" />
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mx-1" />
              <div className="h-0.5 w-full bg-slate-700" />
            </div>
            <span className="text-[10px] text-slate-400">
              {train.stops_between_count === 0
                ? 'Non-stop Direct'
                : `${train.stops_between_count} Intermediate Stop${train.stops_between_count > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Destination Arrival */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Arrival
            </span>
            <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-400 font-semibold mt-0.5 font-mono">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{formatShortDate(journeyDate, train.destination_stop?.day_offset || 0)}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
              {train.arrival_time}
            </div>
            <div className="text-xs font-semibold text-emerald-400 truncate">
              {train.destination_stop.station_name}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Platform 1 • {destinationCode}
            </span>
          </div>
        </div>

        {/* Live Location Status Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isDelayed ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="font-semibold text-slate-200">
              {train.live_status.status}:
            </span>
            <span
              className={`font-medium ${
                isDelayed ? 'text-amber-400 font-bold' : 'text-emerald-400'
              }`}
            >
              {isDelayed
                ? `${train.live_status.delay_minutes} min delay`
                : 'Running Right on Time'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
            <span>{train.live_status.speed} km/h • Near {train.live_status.current_station}</span>
            <button
              type="button"
              onClick={() => onViewDetails(train)}
              className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-sans font-bold text-[10px] border border-amber-500/30 transition cursor-pointer"
            >
              📍 Track Vertical
            </button>
          </div>
        </div>

        {/* Compact Horizontal Live Location Preview */}
        <HorizontalTrackPreview
          stops={train.stops}
          liveStatus={train.live_status}
          boardingCode={boardingCode}
          destinationCode={destinationCode}
        />

        {/* Explainable AI Recommendation Reason Box */}
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs mb-3">
          <div className="flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">AI Recommendation Reason: </span>
              <span className="text-slate-300 leading-relaxed">{train.ai_reason}</span>
            </div>
          </div>
          {train.ai_preference_matches && train.ai_preference_matches.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 ml-5">
              {train.ai_preference_matches.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-medium text-amber-400/90 border border-slate-700"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Fare Breakdown & Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* Available Classes & Base Fare */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              💰 Train Charges (Demo/Project Fare)
            </div>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xs text-slate-400">From</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                ₹{train.base_fare}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({train.calculated_classes[0]?.class_name || 'Standard'})
              </span>
            </div>
          </div>

          {/* Class Badges Preview with Sleeper Highlight */}
          <div className="flex flex-wrap gap-1">
            {train.calculated_classes.map((c, i) => {
              const isSleeper = c.class_name === 'Sleeper' || c.class_name.toLowerCase().includes('sleeper') || c.class_name.includes('SL');
              return (
                <span
                  key={i}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                    isSleeper
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title={`₹${c.fare} • ${c.available_seats} seats`}
                >
                  {c.class_name}: <strong className="text-amber-400 font-mono">₹{c.fare}</strong>
                  <span className="text-[9px] text-slate-400 ml-1 font-normal font-mono">({c.available_seats} left)</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* 3 Mandatory Buttons: View Details, Compare, Book */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* View Details Button */}
          <button
            type="button"
            onClick={() => onViewDetails(train)}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>View Details</span>
          </button>

          {/* Compare Button */}
          <button
            type="button"
            onClick={() => onToggleCompare(train)}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              isCompared
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isCompared ? 'Comparing ✓' : 'Compare'}</span>
          </button>

          {/* Book Train Button */}
          <button
            type="button"
            onClick={() => onBookTrain(train)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 transition transform active:scale-95 cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Book Train</span>
          </button>
        </div>
      </div>
    </div>
  );
};
