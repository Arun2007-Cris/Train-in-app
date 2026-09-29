import React from 'react';
import { TrainStop, LiveStatus } from '../types';

interface HorizontalTrackPreviewProps {
  stops: TrainStop[];
  liveStatus: LiveStatus;
  boardingCode: string;
  destinationCode: string;
}

export const HorizontalTrackPreview: React.FC<HorizontalTrackPreviewProps> = ({
  stops,
  liveStatus,
  boardingCode,
  destinationCode,
}) => {
  // Select a subset of representative stops (first, boarding, current/near, dest, last)
  // so the preview is compact and clean across all screens
  const totalStops = stops.length;
  if (totalStops === 0) return null;

  // Find index of current station in train stops
  const currentIdx = stops.findIndex(
    (s) => s.station_code === liveStatus.current_station_code
  );
  const activeIndex = currentIdx !== -1 ? currentIdx : Math.floor(totalStops * 0.4);

  // Sample 4 to 6 representative station stops for the horizontal display
  let sampleIndices: number[] = [];
  sampleIndices.push(0);

  const bIdx = stops.findIndex((s) => s.station_code === boardingCode);
  const dIdx = stops.findIndex((s) => s.station_code === destinationCode);

  if (bIdx > 0 && bIdx < totalStops - 1) sampleIndices.push(bIdx);
  if (activeIndex > 0 && activeIndex < totalStops - 1 && !sampleIndices.includes(activeIndex)) {
    sampleIndices.push(activeIndex);
  }
  if (dIdx > 0 && dIdx < totalStops - 1 && !sampleIndices.includes(dIdx)) {
    sampleIndices.push(dIdx);
  }
  if (!sampleIndices.includes(totalStops - 1)) {
    sampleIndices.push(totalStops - 1);
  }

  sampleIndices.sort((a, b) => a - b);
  // Ensure not more than 5 nodes for mobile fit
  if (sampleIndices.length > 5) {
    sampleIndices = [sampleIndices[0], sampleIndices[1], sampleIndices[sampleIndices.length - 2], sampleIndices[sampleIndices.length - 1]];
    if (!sampleIndices.includes(activeIndex)) {
      sampleIndices.splice(2, 0, activeIndex);
    }
  }

  const sampledStops = sampleIndices.map((idx) => stops[idx]);

  return (
    <div className="py-2.5 px-3 bg-slate-950/70 border border-slate-800/80 rounded-xl my-3">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Horizontal Live Track Preview
        </span>
        <span className="text-[10px] text-amber-400/90 font-mono">
          Current: {liveStatus.current_station || stops[activeIndex]?.station_name}
        </span>
      </div>

      {/* Horizontal Rail Track Line */}
      <div className="relative pt-4 pb-2 px-3">
        {/* The Track Line */}
        <div className="absolute top-7 left-6 right-6 h-1 bg-slate-800 rounded-full">
          {/* Progress bar up to active position */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(10, Math.min(100, liveStatus.progress_percentage || 45))}%` }}
          />
        </div>

        {/* Nodes along the track */}
        <div className="relative flex items-center justify-between z-10">
          {sampledStops.map((stop, idx) => {
            const isCurrent = stop.station_code === liveStatus.current_station_code || idx === Math.min(sampledStops.length - 1, Math.floor(sampledStops.length / 2));
            const isPassed = liveStatus.passed_station_ids?.includes(stop.station_id) || (idx === 0);
            const isBoarding = stop.station_code === boardingCode;
            const isDest = stop.station_code === destinationCode;

            return (
              <div key={stop.stop_id || idx} className="flex flex-col items-center relative group">
                {/* Current Train Icon Popup Indicator */}
                {isCurrent && (
                  <div className="absolute -top-7 flex flex-col items-center animate-bounce z-20">
                    <div className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black tracking-tight shadow-md flex items-center gap-1">
                      <span>🚆</span>
                      <span className="hidden sm:inline">LIVE</span>
                    </div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rotate-45 -mt-0.5" />
                  </div>
                )}

                {/* Node Circle */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition ${
                    isCurrent
                      ? 'bg-amber-400 border-amber-300 ring-4 ring-amber-500/30'
                      : isPassed
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'bg-slate-900 border-slate-700'
                  }`}
                >
                  {isPassed && !isCurrent && (
                    <div className="w-1 h-1 rounded-full bg-slate-950" />
                  )}
                </div>

                {/* Station Code & Name */}
                <div className="mt-2 text-center">
                  <span
                    className={`block text-[10px] font-bold ${
                      isCurrent
                        ? 'text-amber-400'
                        : isBoarding
                        ? 'text-amber-300 underline'
                        : isDest
                        ? 'text-emerald-400 underline'
                        : 'text-slate-400'
                    }`}
                  >
                    {stop.station_code}
                  </span>
                  <span className="hidden sm:block text-[9px] text-slate-500 truncate max-w-[65px]">
                    {stop.station_name.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-500 mt-1">
        ↑ Simulated live train position along route corridor
      </div>
    </div>
  );
};
