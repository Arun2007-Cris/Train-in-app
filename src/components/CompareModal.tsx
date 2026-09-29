import React from 'react';
import { X, Sparkles, Trophy, Check, ArrowRight, Clock, Ticket } from 'lucide-react';
import { SearchResultTrain } from '../types';

interface CompareModalProps {
  trains: SearchResultTrain[];
  onClose: () => void;
  onBook: (train: SearchResultTrain) => void;
  onRemove: (trainId: number) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  trains,
  onClose,
  onBook,
  onRemove,
}) => {
  if (trains.length === 0) return null;

  // Find the highest AI score train to highlight as the AI-selected best option
  const bestTrain = trains.reduce((prev, current) =>
    current.ai_score > prev.ai_score ? current : prev
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Compare Trains</h2>
              <p className="text-xs text-slate-400">
                Side-by-side analysis with AI recommendation highlight
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table Container */}
        <div className="overflow-x-auto py-4 flex-1">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-44 bg-slate-950/40 rounded-tl-xl">
                  Feature
                </th>
                {trains.map((t) => {
                  const isBest = t.train_id === bestTrain.train_id;
                  return (
                    <th
                      key={t.train_id}
                      className={`py-3 px-4 text-sm font-bold relative ${
                        isBest
                          ? 'bg-amber-500/10 border-t-2 border-amber-400 text-amber-300'
                          : 'bg-slate-950/20 text-slate-200'
                      }`}
                    >
                      {isBest && (
                        <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                          <Trophy className="w-3 h-3" />
                          AI Top Pick
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-xs text-slate-400">#{t.train_number}</div>
                          <div className="font-extrabold text-white">{t.train_name}</div>
                        </div>
                        {trains.length > 1 && (
                          <button
                            onClick={() => onRemove(t.train_id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {/* Row: AI Score */}
              <tr className="bg-slate-950/30">
                <td className="py-3 px-4 font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI Match Score
                </td>
                {trains.map((t) => {
                  const isBest = t.train_id === bestTrain.train_id;
                  return (
                    <td key={t.train_id} className={`py-3 px-4 ${isBest ? 'bg-amber-500/10' : ''}`}>
                      <span className="text-lg font-black font-mono text-amber-400">
                        {t.ai_score}
                      </span>
                      <span className="text-[10px] text-slate-400">/100</span>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{t.ai_reason}</p>
                    </td>
                  );
                })}
              </tr>

              {/* Row: Train Type */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400">Train Type</td>
                {trains.map((t) => (
                  <td key={t.train_id} className="py-3 px-4 font-semibold text-slate-200">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                      {t.train_type}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Departure */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400">Departure</td>
                {trains.map((t) => (
                  <td key={t.train_id} className="py-3 px-4">
                    <span className="text-sm font-bold font-mono text-white">{t.departure_time}</span>
                    <span className="block text-[11px] text-slate-400">{t.boarding_stop.station_name}</span>
                  </td>
                ))}
              </tr>

              {/* Row: Arrival */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400">Arrival</td>
                {trains.map((t) => (
                  <td key={t.train_id} className="py-3 px-4">
                    <span className="text-sm font-bold font-mono text-white">{t.arrival_time}</span>
                    <span className="block text-[11px] text-slate-400">{t.destination_stop.station_name}</span>
                  </td>
                ))}
              </tr>

              {/* Row: Journey Duration */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400">Journey Duration</td>
                {trains.map((t) => (
                  <td key={t.train_id} className="py-3 px-4 font-bold text-amber-300 font-mono">
                    {t.journey_duration}
                    <span className="block text-[10px] text-slate-500 font-normal">
                      {t.stops_between_count} Intermediate Stops
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Base Fare */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400">Fare (Demo/Project)</td>
                {trains.map((t) => (
                  <td key={t.train_id} className="py-3 px-4">
                    <span className="text-base font-black text-amber-400 font-mono">
                      ₹{t.base_fare}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Starting base fare</span>
                  </td>
                ))}
              </tr>

              {/* Row: Classes */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400">Applicable Classes</td>
                {trains.map((t) => (
                  <td key={t.train_id} className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {t.calculated_classes.map((c, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                          {c.class_name} (₹{c.fare})
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Running Status */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-400">Running Status</td>
                {trains.map((t) => {
                  const delayed = (t.live_status?.delay_minutes || 0) > 0;
                  return (
                    <td key={t.train_id} className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold ${delayed ? 'text-amber-400' : 'text-emerald-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${delayed ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        {delayed ? `${t.live_status.delay_minutes}m Delay` : 'On Time'}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        At {t.live_status.current_station} ({t.live_status.speed} km/h)
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Row: Actions */}
              <tr className="bg-slate-950/40">
                <td className="py-4 px-4 font-bold text-slate-400">Action</td>
                {trains.map((t) => {
                  const isBest = t.train_id === bestTrain.train_id;
                  return (
                    <td key={t.train_id} className="py-4 px-4">
                      <button
                        onClick={() => {
                          onBook(t);
                          onClose();
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                          isBest
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Book #{t.train_number}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
