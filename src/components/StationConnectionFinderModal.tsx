import React, { useState, useEffect } from 'react';
import {
  X,
  GitFork,
  ArrowRight,
  Sparkles,
  Train,
  Clock,
  MapPin,
  Ticket,
  Search,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Station, ConnectingTrainRoute, SearchResultTrain } from '../types';
import { ConnectingTrainCard } from './ConnectingTrainCard';
import { SearchableStationInput } from './SearchableStationInput';

interface StationConnectionFinderModalProps {
  initialFromStationCode: string;
  initialDestinationCode?: string;
  stations: Station[];
  onClose: () => void;
  onBookConnectingTrain: (route: ConnectingTrainRoute) => void;
  onViewConnectingRoute: (route: ConnectingTrainRoute) => void;
  onBookDirectTrain?: (train: SearchResultTrain) => void;
}

export const StationConnectionFinderModal: React.FC<StationConnectionFinderModalProps> = ({
  initialFromStationCode,
  initialDestinationCode = 'TPJ',
  stations,
  onClose,
  onBookConnectingTrain,
  onViewConnectingRoute,
  onBookDirectTrain,
}) => {
  const [fromCode, setFromCode] = useState(initialFromStationCode);
  const [destCode, setDestCode] = useState(() => {
    if (initialDestinationCode && initialDestinationCode !== initialFromStationCode) {
      return initialDestinationCode;
    }
    // Default to a different station
    const other = stations.find((s) => s.station_code !== initialFromStationCode);
    return other ? other.station_code : 'MAS';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [connectingRoutes, setConnectingRoutes] = useState<ConnectingTrainRoute[]>([]);
  const [directTrains, setDirectTrains] = useState<SearchResultTrain[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const fetchConnections = async (origin: string, target: string) => {
    if (!origin || !target || origin === target) return;
    setIsLoading(true);
    setHasQueried(true);

    try {
      const res = await fetch('/api/search-trains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boarding_code: origin,
          destination_code: target,
          journey_date: new Date().toISOString().split('T')[0],
          journey_time: '08:00',
          preference: 'Best overall',
          include_departed: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDirectTrains(data.available_trains || []);
        setConnectingRoutes(data.connecting_trains || []);
      } else {
        // Fallback dedicated connecting endpoint
        const cRes = await fetch('/api/connecting-trains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boarding_code: origin,
            destination_code: target,
          }),
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          setConnectingRoutes(cData.connecting_trains || []);
        }
      }
    } catch {
      // Graceful fallback to client state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections(fromCode, destCode);
  }, [fromCode, destCode]);

  const fromStation = stations.find((s) => s.station_code === fromCode);
  const destStation = stations.find((s) => s.station_code === destCode);

  const popularStations = ['PGI', 'CLT', 'TIR', 'MAS', 'SBC', 'ED', 'SRR', 'TPJ', 'CBE', 'NDLS'];

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
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Location Connective Transit Engine
                </span>
                <span className="text-xs text-slate-400">Zero Dead-End Guarantee</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Connecting Trains from {fromStation?.station_name || fromCode} ({fromCode})
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

        {/* Origin / Destination Selector Bar */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 my-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Origin Station Searchable Input */}
            <div className="sm:col-span-5">
              <SearchableStationInput
                label="From Location"
                dotColor="bg-amber-400"
                selectedCode={fromCode}
                onSelect={(code) => setFromCode(code)}
                stations={stations}
                placeholder="Type boarding station or junction..."
                themeColor="amber"
              />
            </div>

            <div className="sm:col-span-2 flex justify-center text-amber-400 pt-5 sm:pt-4">
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-md">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Destination Station Searchable Input */}
            <div className="sm:col-span-5">
              <SearchableStationInput
                label="To Target Destination"
                dotColor="bg-emerald-400"
                selectedCode={destCode}
                onSelect={(code) => setDestCode(code)}
                stations={stations}
                placeholder="Type destination station or junction..."
                themeColor="emerald"
              />
            </div>
          </div>

          {/* Quick Destination Pills */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 mr-1">Quick Select:</span>
            {popularStations
              .filter((code) => code !== fromCode)
              .map((code) => {
                const st = stations.find((s) => s.station_code === code);
                const isSelected = destCode === code;
                return (
                  <button
                    key={code}
                    onClick={() => setDestCode(code)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {st ? st.station_name : code}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Content Area: NEVER show doesn't have train */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white">
                Discovering Connecting Trains via Junction Hubs...
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Calculating transfer buffers, cross-platform timings, and optimal rakes.
              </p>
            </div>
          ) : (
            <>
              {/* Direct Train Notice if present */}
              {directTrains.length > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>{directTrains.length} direct train(s)</strong> operate on this line. We also found <strong>{connectingRoutes.length} connecting routes</strong> below.
                    </span>
                  </div>
                  {onBookDirectTrain && (
                    <button
                      onClick={() => onBookDirectTrain(directTrains[0])}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg transition"
                    >
                      Book Direct (#{directTrains[0].train_number})
                    </button>
                  )}
                </div>
              )}

              {/* Informational banner when direct trains are absent */}
              {directTrains.length === 0 && (
                <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center space-x-3 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-slate-300">
                    No direct line runs between <strong className="text-white">{fromCode}</strong> and <strong className="text-white">{destCode}</strong>. Our AI Engine has connected you via major junction stations with comfortable layovers.
                  </p>
                </div>
              )}

              {/* Connecting Train Cards List */}
              <div className="space-y-4">
                {connectingRoutes.map((route) => (
                  <ConnectingTrainCard
                    key={route.connection_id}
                    route={route}
                    onBook={(r) => {
                      onBookConnectingTrain(r);
                      onClose();
                    }}
                    onViewConnectedRoute={(r) => {
                      onViewConnectingRoute(r);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {connectingRoutes.length} connected route{connectingRoutes.length === 1 ? '' : 's'} available
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
