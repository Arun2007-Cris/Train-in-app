import React, { useState, useEffect } from 'react';
import {
  Train,
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  Gauge,
  Sparkles,
  ArrowRight,
  Radio,
  Play,
  RotateCcw,
  AlertTriangle,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  GitFork,
  Calendar
} from 'lucide-react';
import { SearchResultTrain, TrainStop, AIDelayPrediction } from '../types';
import { formatSegmentDate } from '../utils/dateUtils';

interface VerticalRouteTrackerProps {
  train: SearchResultTrain;
  boardingCode?: string;
  destinationCode?: string;
  journeyDate?: string;
  onAdvanceSimulation?: (newStation: TrainStop) => void;
  onOpenCopilot?: () => void;
  onOpenConnectingFinder?: (stationCode: string) => void;
}

export const VerticalRouteTracker: React.FC<VerticalRouteTrackerProps> = ({
  train,
  boardingCode,
  destinationCode,
  journeyDate,
  onAdvanceSimulation,
  onOpenCopilot,
  onOpenConnectingFinder,
}) => {
  const [currentIdx, setCurrentIdx] = useState(() => {
    const idx = train.stops.findIndex(
      (s) => s.station_code === train.live_status.current_station_code
    );
    return idx !== -1 ? idx : Math.min(train.stops.length - 1, 2);
  });

  const [currentSpeed, setCurrentSpeed] = useState(train.live_status.speed || 74);
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<AIDelayPrediction | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [filterStops, setFilterStops] = useState<'all' | 'key'>('all');

  const bCode = boardingCode || train.boarding_stop?.station_code;
  const dCode = destinationCode || train.destination_stop?.station_code;

  const currentStop = train.stops[currentIdx] || train.stops[0];
  const nextStop = train.stops[currentIdx + 1] || null;

  // Fetch AI journey prediction on mount or train change
  useEffect(() => {
    let isMounted = true;
    const fetchPrediction = async () => {
      setIsLoadingAI(true);
      try {
        const res = await fetch('/api/ai/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ train }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.prediction) {
            setAiPrediction(data.prediction);
          }
        }
      } catch {
        // Fallback gracefully without console warning
      } finally {
        if (isMounted) setIsLoadingAI(false);
      }
    };

    fetchPrediction();
    return () => {
      isMounted = false;
    };
  }, [train.train_id]);

  const handleAdvance = () => {
    if (currentIdx < train.stops.length - 1) {
      const nextI = currentIdx + 1;
      setCurrentIdx(nextI);
      const newSpeed = Math.floor(62 + Math.random() * 32);
      setCurrentSpeed(newSpeed);

      if (onAdvanceSimulation) {
        onAdvanceSimulation(train.stops[nextI]);
      }
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setCurrentSpeed(68);
  };

  return (
    <div className="space-y-4">
      {/* Live Operational Status Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Live GPS Signal
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-400">
                  Updated: {train.live_status.last_updated}
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                <span>Current:</span>
                <span className="text-amber-400 font-extrabold font-mono">{currentStop.station_name}</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {currentStop.station_code}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">
                Speed
              </span>
              <span className="font-bold text-amber-400 text-sm">
                {currentSpeed} <span className="text-[10px] text-slate-400">km/h</span>
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">
                Delay
              </span>
              <span className={`text-sm font-bold ${train.live_status.delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {train.live_status.delay_minutes > 0 ? `+${train.live_status.delay_minutes}m` : 'On Time'}
              </span>
            </div>

            {nextStop && (
              <div className="hidden sm:block bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">
                  Next Stop
                </span>
                <span className="text-slate-200 font-bold truncate max-w-[130px] block">
                  {nextStop.station_name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Simulation Action Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-400 text-[11px]">
            Station <strong className="text-white font-mono">{currentIdx + 1}</strong> of <strong className="text-white font-mono">{train.stops.length}</strong> along route
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdvance}
              disabled={currentIdx >= train.stops.length - 1}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Simulate train moving to next station"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Advance to Next Stop</span>
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Reset simulation to origin"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Journey & Telemetry Card */}
      {aiPrediction && (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Gemini AI Route Telemetry</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                    {aiPrediction.confidence_score}% Confidence
                  </span>
                </span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {aiPrediction.ai_summary}
                </p>
              </div>
            </div>
            {onOpenCopilot && (
              <button
                onClick={onOpenCopilot}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition cursor-pointer"
              >
                Ask Copilot
              </button>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
            <span>Weather: <strong className="text-slate-200">{aiPrediction.weather_condition}</strong></span>
            <span>Transfer Advice: <strong className="text-amber-300">{aiPrediction.connecting_buffer_advice}</strong></span>
          </div>
        </div>
      )}

      {/* VERTICAL ROUTE TIMELINE */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-inner">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Vertical Station Corridor ({train.stops.length} Stations)
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Passed
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Live Now
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-700" /> Upcoming
            </span>
          </div>
        </div>

        {/* Vertical Stations Line */}
        <div className="relative pl-6 sm:pl-8 space-y-6 sm:space-y-7 before:absolute before:left-[17px] sm:before:left-[21px] before:top-3 before:bottom-3 before:w-1 before:bg-slate-800">
          {train.stops.map((stop, idx) => {
            const isOrigin = idx === 0;
            const isDestinationStation = idx === train.stops.length - 1;
            const isBoarding = stop.station_code === bCode;
            const isUserDestination = stop.station_code === dCode;
            const isCurrent = idx === currentIdx;
            const isPassed = idx < currentIdx;
            const isUpcoming = idx > currentIdx;

            return (
              <div key={stop.station_code + idx} className="relative group">
                {/* Colored Track Segment overlay for passed route */}
                {isPassed && idx < train.stops.length - 1 && (
                  <div className="absolute -left-[18px] sm:-left-[22px] top-4 w-1 h-[calc(100%+24px)] bg-emerald-500/60 z-0" />
                )}

                {/* Node Bullet / Locomotive indicator */}
                <div className="absolute -left-[25px] sm:-left-[29px] top-0.5 z-10">
                  {isCurrent ? (
                    <div className="relative flex items-center justify-center">
                      <span className="w-7 h-7 rounded-full bg-amber-500/30 animate-ping absolute" />
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/50 border-2 border-slate-900 font-bold">
                        <Train className="w-4 h-4" />
                      </div>
                    </div>
                  ) : isPassed ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center border-2 border-slate-900">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        isBoarding
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : isUserDestination
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-700 bg-slate-900 text-slate-500'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    </div>
                  )}
                </div>

                {/* Station Card Content */}
                <div
                  className={`p-3 sm:p-4 rounded-xl border transition ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : isBoarding
                      ? 'bg-slate-900/90 border-amber-500/40'
                      : isUserDestination
                      ? 'bg-slate-900/90 border-emerald-500/40'
                      : isPassed
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                        {stop.station_code}
                      </span>
                      <h5 className="text-sm font-extrabold text-white">
                        {stop.station_name}
                      </h5>

                      {/* Station Badges */}
                      {isOrigin && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 uppercase">
                          Origin
                        </span>
                      )}
                      {isDestinationStation && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 uppercase">
                          Terminal
                        </span>
                      )}
                      {isBoarding && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase shadow-sm">
                          Your Boarding Stop
                        </span>
                      )}
                      {isUserDestination && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase shadow-sm">
                          Your Destination
                        </span>
                      )}
                    </div>

                    {/* Date, Distance & Platform */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                      <span className="text-amber-400/90 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatSegmentDate(journeyDate, stop.day_offset, false)}
                      </span>
                      <span>•</span>
                      <span>Platform {stop.platform_number || (idx % 3) + 1}</span>
                      <span>•</span>
                      <span>{stop.distance_km} km</span>
                    </div>
                  </div>

                  {/* Arrival / Departure / Halt Row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">
                          Arr
                        </span>
                        <span className="text-slate-200 font-bold">
                          {stop.arrival_time || 'Start'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">
                          Dep
                        </span>
                        <span className="text-amber-400 font-bold">
                          {stop.departure_time || 'End'}
                        </span>
                      </div>
                      {typeof stop.halt_minutes === 'number' && stop.halt_minutes > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">
                            Halt
                          </span>
                          <span className="text-slate-400">
                            {stop.halt_minutes} min
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Live State indicator and connecting action */}
                    <div className="flex items-center space-x-2">
                      {onOpenConnectingFinder && (
                        <button
                          onClick={() => onOpenConnectingFinder(stop.station_code)}
                          className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 transition cursor-pointer"
                          title={`Find connecting trains from ${stop.station_name}`}
                        >
                          <GitFork className="w-3 h-3 rotate-90" />
                          <span>Connecting Trains</span>
                        </button>
                      )}

                      {isCurrent && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                            <Radio className="w-3 h-3 animate-pulse" />
                            Train Here Now • {currentSpeed} km/h
                          </span>
                        </div>
                      )}
                      {isPassed && (
                        <span className="text-[11px] text-emerald-400 font-sans font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Passed
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-[11px] text-slate-500 font-sans">
                          Upcoming ({stop.distance_km - currentStop.distance_km > 0 ? `in ${stop.distance_km - currentStop.distance_km} km` : ''})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
