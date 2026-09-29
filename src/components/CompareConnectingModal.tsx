import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  Check,
  ArrowRight,
  Clock,
  Ticket,
  GitFork,
  Hotel,
  ShieldCheck,
  AlertTriangle,
  Bed,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';
import { ConnectingTrainRoute, ConnectingComparisonAIResult } from '../types';

interface CompareConnectingModalProps {
  routes: ConnectingTrainRoute[];
  onClose: () => void;
  onBook: (route: ConnectingTrainRoute) => void;
  onRemove: (connectionId: string) => void;
  onOpenHotels: (route: ConnectingTrainRoute) => void;
}

export const CompareConnectingModal: React.FC<CompareConnectingModalProps> = ({
  routes,
  onClose,
  onBook,
  onRemove,
  onOpenHotels,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [comparisonResult, setComparisonResult] = useState<ConnectingComparisonAIResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchComparison = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/compare-connecting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routes, preference: 'Best overall' }),
        });
        const data = await res.json();
        if (data.success && data.comparison && isMounted) {
          setComparisonResult(data.comparison);
        }
      } catch (err) {
        console.error('Failed to fetch AI comparison:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (routes.length > 0) {
      fetchComparison();
    }
    return () => {
      isMounted = false;
    };
  }, [routes]);

  if (routes.length === 0) return null;

  // Best route according to AI or highest ai_score
  const winnerId = comparisonResult?.ai_winner_connection_id || routes[0]?.connection_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-6xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Compare Connecting Trains
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Advanced AI Analysis
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side evaluation of interchange junctions, transfer buffers, leg classes & combined fares
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

        {/* AI Verdict Banner */}
        {comparisonResult && (
          <div className="my-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-amber-500/10 border border-amber-500/40 shadow-lg shrink-0">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5 shadow">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Advanced AI Verdict & Recommendation
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Powered by Gemini Intelligence
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-200 mt-1 leading-relaxed">
                  {comparisonResult.verdict_summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table / Side-by-Side Cards */}
        <div className="overflow-x-auto py-2 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-[700px]">
            {routes.map((route, idx) => {
              const isWinner = route.connection_id === winnerId;
              const evalItem = comparisonResult?.routes?.find(r => r.connection_id === route.connection_id);
              const leg1HasSleeper = route.leg1.calculated_classes?.some(c => c.class_name.includes('Sleeper'));
              const leg2HasSleeper = route.leg2.calculated_classes?.some(c => c.class_name.includes('Sleeper'));

              return (
                <div
                  key={route.connection_id}
                  className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-200 relative ${
                    isWinner
                      ? 'bg-slate-950 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge: AI Winner or Option Index */}
                  <div className="flex items-center justify-between mb-3">
                    {isWinner ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                        <Trophy className="w-3 h-3" />
                        AI Recommended Option
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                        Route Option #{idx + 1}
                      </span>
                    )}

                    {routes.length > 1 && (
                      <button
                        onClick={() => onRemove(route.connection_id)}
                        className="text-slate-500 hover:text-rose-400 p-1 text-xs cursor-pointer transition"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Junction Transfer Headline */}
                  <div className="mb-3.5 pb-3 border-b border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                      Interchange Junction
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5">
                      Via {route.junction_station_name} ({route.junction_station_code})
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Layover: <strong className="text-white">{route.layover_duration}</strong>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        route.layover_minutes >= 30 && route.layover_minutes <= 90
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : route.layover_minutes < 30
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}>
                        {route.layover_minutes >= 30 && route.layover_minutes <= 90 ? 'Optimal Buffer' : route.layover_minutes < 30 ? 'Tight Buffer' : 'Extended Buffer'}
                      </span>
                    </div>
                  </div>

                  {/* Leg 1 & Leg 2 Overview */}
                  <div className="space-y-2 mb-3.5 text-xs">
                    {/* Leg 1 */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-extrabold text-amber-400">Leg 1 Train</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                          {route.leg1.train_type}
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs truncate">
                        #{route.leg1.train_number} {route.leg1.train_name}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Dep: {route.leg1.departure_time}</span>
                        <span>➔</span>
                        <span>Arr: {route.leg1.arrival_time}</span>
                      </div>
                    </div>

                    {/* Leg 2 */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-extrabold text-emerald-400">Leg 2 Train</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                          {route.leg2.train_type}
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs truncate">
                        #{route.leg2.train_number} {route.leg2.train_name}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Dep: {route.leg2.departure_time}</span>
                        <span>➔</span>
                        <span>Arr: {route.leg2.arrival_time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Journey Metrics (Time, Distance, Combined Fare) */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Time</span>
                      <span className="text-sm font-black text-white font-mono">{route.total_duration}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Combined Fare</span>
                      <span className="text-sm font-black text-amber-400 font-mono">₹{route.total_base_fare}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Distance</span>
                      <span className="text-xs font-mono text-slate-300">{route.total_distance_km} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">AI Match Score</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">{route.ai_score}%</span>
                    </div>
                  </div>

                  {/* Multi-Class Flexibility Feature Notice */}
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 mb-3 flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5 shrink-0" />
                    <span>Independent Class Selection: Choose different classes for Leg 1 & Leg 2 while booking.</span>
                  </div>

                  {/* Pros & AI Guidance */}
                  {evalItem && evalItem.pros && (
                    <div className="space-y-1 mb-3 text-[11px] text-slate-300">
                      {evalItem.pros.map((pro, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-800 space-y-2 mt-auto">
                    <button
                      onClick={() => onOpenHotels(route)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      <span>🏨 Hotels & Pods at {route.junction_station_code}</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onBook(route);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Book Connecting Route (₹{route.total_base_fare})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Connecting routes are verified against real station timetables with transit buffer guarantees.</span>
          </div>

          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
