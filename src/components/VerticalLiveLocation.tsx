import React, { useState } from 'react';
import {
  X,
  Navigation,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  Sparkles,
  ArrowRight,
  Radio,
  Play,
  RotateCcw,
  BellRing,
  GitFork
} from 'lucide-react';
import { SearchResultTrain, TrainStop, LiveStatus } from '../types';

interface VerticalLiveLocationProps {
  train: SearchResultTrain;
  boardingCode: string;
  destinationCode: string;
  onClose: () => void;
  onTriggerNotification?: (message: string, type: 'approaching' | 'arrival' | 'destination') => void;
  onOpenCopilot?: () => void;
  onOpenConnectingFinder?: (stationCode: string) => void;
}

export const VerticalLiveLocation: React.FC<VerticalLiveLocationProps> = ({
  train,
  boardingCode,
  destinationCode,
  onClose,
  onTriggerNotification,
  onOpenCopilot,
  onOpenConnectingFinder,
}) => {
  // Local state to simulate live progress
  const [currentIdx, setCurrentIdx] = useState(() => {
    const idx = train.stops.findIndex(
      (s) => s.station_code === train.live_status.current_station_code
    );
    return idx !== -1 ? idx : Math.min(train.stops.length - 1, 3);
  });

  const [speed, setSpeed] = useState(train.live_status.speed || 74);
  const [delay, setDelay] = useState(train.live_status.delay_minutes || 0);

  const currentStop = train.stops[currentIdx] || train.stops[0];
  const nextStop = train.stops[currentIdx + 1] || null;

  // Handler to advance train along route for interactive demo
  const handleAdvanceStation = () => {
    if (currentIdx < train.stops.length - 1) {
      const nextIndex = currentIdx + 1;
      setCurrentIdx(nextIndex);
      const newStop = train.stops[nextIndex];
      const newSpeed = Math.floor(55 + Math.random() * 35);
      setSpeed(newSpeed);

      if (onTriggerNotification) {
        if (newStop.station_code === boardingCode) {
          onTriggerNotification(
            `Your train #${train.train_number} ${train.train_name} has arrived at ${newStop.station_name}. Please proceed to Platform 2.`,
            'arrival'
          );
        } else if (nextIndex + 1 < train.stops.length && train.stops[nextIndex + 1].station_code === boardingCode) {
          onTriggerNotification(
            `Your train #${train.train_number} is approaching ${boardingCode}. Please be ready on Platform 2 to board.`,
            'approaching'
          );
        } else if (newStop.station_code === destinationCode) {
          onTriggerNotification(
            `Your destination ${newStop.station_name} is approaching. Please prepare your luggage to get down.`,
            'destination'
          );
        }
      }
    }
  };

  const handleResetSimulation = () => {
    setCurrentIdx(0);
    setSpeed(65);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-amber-400">
                #{train.train_number}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {train.train_type}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                GPS Tracking Active
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              Live Location: {train.train_name}
            </h2>
            <p className="text-xs text-slate-400">
              {train.source} ({train.source_code}) ➔ {train.destination} ({train.destination_code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice of Simulation */}
        <div className="my-3 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="font-medium">
              Demo / Simulated Live Status • Project Telemetry Feed
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400/80 hidden sm:inline">
            Refreshes in real-time
          </span>
        </div>

        {/* Horizontal Current Departure & Route Timeline */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner mb-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Current Departure
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white block mt-0.5">{train.departure_time}</span>
              <span className="text-xs text-amber-300 font-bold block truncate">{train.boarding_stop.station_name}</span>
              <span className="text-[10px] text-slate-500 font-mono">Platform 2 • {train.boarding_stop.station_code}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-3 py-1 border-y sm:border-y-0 sm:border-x border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <span>{train.journey_duration}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-mono">{train.journey_distance_km} km</span>
              </span>
              <div className="w-full flex items-center my-1 relative max-w-[200px]">
                <div className="h-0.5 w-full bg-slate-800" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[9px] text-amber-400 flex items-center gap-1 shadow">
                    <span>🚆</span>
                    <span className="text-emerald-400 font-bold">{speed} km/h</span>
                  </span>
                </div>
                <div className="h-0.5 w-full bg-slate-800" />
              </div>
              <span className="text-[10px] text-slate-400">Near: <strong className="text-slate-200">{currentStop.station_name}</strong></span>
            </div>

            <div className="min-w-[140px] text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center sm:justify-end gap-1">
                <span>Destination Arrival</span>
                <MapPin className="w-3 h-3" />
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white block mt-0.5">{train.arrival_time}</span>
              <span className="text-xs text-emerald-300 font-bold block truncate">{train.destination_stop.station_name}</span>
              <span className="text-[10px] text-slate-500 font-mono">Platform 1 • {train.destination_stop.station_code}</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Current Station
            </span>
            <span className="text-xs font-bold text-white truncate block mt-0.5">
              {currentStop.station_name}
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              Code: {currentStop.station_code}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Next Stop
            </span>
            <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">
              {nextStop ? nextStop.station_name : 'Final Terminus'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {nextStop ? `ETA: ${nextStop.arrival_time}` : 'End of Run'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Speed
            </span>
            <span className="text-base font-black text-amber-400 font-mono block">
              {speed} <span className="text-xs font-normal text-slate-400">km/h</span>
            </span>
            <span className="text-[10px] text-emerald-400">Normal Cruising</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Punctuality
            </span>
            <span
              className={`text-xs font-bold block mt-0.5 ${
                delay > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {delay > 0 ? `${delay} min delay` : 'On Time (0 min)'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Updated just now
            </span>
          </div>
        </div>

        {/* Simulation Action Bar */}
        <div className="mb-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Evaluator Tools:</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAdvanceStation}
              disabled={currentIdx >= train.stops.length - 1}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
              title="Move train to the next halt"
            >
              <Play className="w-3 h-3 fill-slate-950" />
              <span>Simulate Next Station</span>
            </button>
            <button
              onClick={handleResetSimulation}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Reset train to beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Detailed Vertical Route Timeline */}
        <div className="overflow-y-auto flex-1 pr-2 space-y-4">
          <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {train.stops.map((stop, index) => {
              const isCurrent = index === currentIdx;
              const isPassed = index < currentIdx;
              const isUpcoming = index > currentIdx;
              const isBoarding = stop.station_code === boardingCode;
              const isDestination = stop.station_code === destinationCode;

              return (
                <div key={stop.stop_id} className="relative pb-6 last:pb-0">
                  {/* Node Circle or Current Train Icon */}
                  {isCurrent ? (
                    <div className="absolute -left-6 sm:-left-8 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-lg shadow-amber-400/40 ring-4 ring-amber-500/20 animate-pulse z-10">
                      🚆
                    </div>
                  ) : isPassed ? (
                    <div className="absolute -left-4 sm:-left-6 top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-[10px] z-10">
                      ✓
                    </div>
                  ) : (
                    <div className="absolute -left-3.5 sm:-left-5 top-1.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-950 border-2 border-slate-700 z-10" />
                  )}

                  {/* Stop Details Card */}
                  <div
                    className={`p-3 sm:p-3.5 rounded-2xl border transition ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : isBoarding
                        ? 'bg-slate-950 border-amber-500/30'
                        : isDestination
                        ? 'bg-slate-950 border-emerald-500/30'
                        : isPassed
                        ? 'bg-slate-950/40 border-slate-900 opacity-60'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">
                          {stop.station_name}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {stop.station_code}
                        </span>
                        {isBoarding && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                            YOUR BOARDING
                          </span>
                        )}
                        {isDestination && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                            YOUR DESTINATION
                          </span>
                        )}
                      </div>

                      {/* Status Tag */}
                      <div>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide">
                            CURRENT LOCATION
                          </span>
                        ) : isPassed ? (
                          <span className="text-[11px] font-semibold text-emerald-400">
                            ✓ Passed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Upcoming</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                        <span>Arr: <strong className="text-slate-200">{stop.arrival_time}</strong></span>
                        <span>Dep: <strong className="text-slate-200">{stop.departure_time}</strong></span>
                        <span>Distance: {stop.distance_km} km</span>
                        <span>Platform: {stop.platform_number || 2}</span>
                      </div>

                      {onOpenConnectingFinder && (
                        <button
                          onClick={() => onOpenConnectingFinder(stop.station_code)}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition cursor-pointer"
                          title={`Find connecting trains from ${stop.station_name}`}
                        >
                          <GitFork className="w-3.5 h-3.5 rotate-90" />
                          <span>Connecting Trains</span>
                        </button>
                      )}
                    </div>

                    {isCurrent && (
                      <div className="mt-2.5 pt-2 border-t border-amber-500/20 text-xs text-amber-300 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>Train is currently halted / moving through {stop.station_name}. Next stop is {nextStop?.station_name || 'Destination'}.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
          {onOpenCopilot ? (
            <button
              onClick={onOpenCopilot}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Copilot</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
