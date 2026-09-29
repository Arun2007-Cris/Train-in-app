import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  ArrowRightLeft,
  Search,
  Sparkles,
  AlertTriangle,
  Flame,
  Check
} from 'lucide-react';
import { Station, UserPreference } from '../types';
import { SearchableStationInput } from './SearchableStationInput';

interface JourneyPageProps {
  stations: Station[];
  initialBoarding?: string;
  initialDestination?: string;
  initialDate?: string;
  initialTime?: string;
  initialPreference?: UserPreference;
  onSearch: (params: {
    boarding_code: string;
    destination_code: string;
    journey_date: string;
    journey_time: string;
    preference: UserPreference;
  }) => void;
}

export const JourneyPage: React.FC<JourneyPageProps> = ({
  stations,
  initialBoarding = 'SRR',
  initialDestination = 'TPJ',
  initialDate,
  initialTime,
  initialPreference = 'Best overall',
  onSearch,
}) => {
  // Helper to get local date "YYYY-MM-DD"
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to get current time "HH:MM"
  const getCurrentTime = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [boardingCode, setBoardingCode] = useState(initialBoarding);
  const [destinationCode, setDestinationCode] = useState(initialDestination);
  const [journeyDate, setJourneyDate] = useState(initialDate || getTodayDate());
  const [journeyTime, setJourneyTime] = useState(initialTime || '08:30');
  const [preference, setPreference] = useState<UserPreference>(initialPreference);
  const [validationError, setValidationError] = useState('');

  const handleSwapStations = () => {
    const temp = boardingCode;
    setBoardingCode(destinationCode);
    setDestinationCode(temp);
    setValidationError('');
  };

  const handleUseCurrentDateTime = () => {
    setJourneyDate(getTodayDate());
    setJourneyTime(getCurrentTime());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardingCode || !destinationCode) {
      setValidationError('Please select both boarding and destination stations.');
      return;
    }
    if (boardingCode === destinationCode) {
      setValidationError('Boarding station and destination station cannot be identical.');
      return;
    }

    setValidationError('');
    onSearch({
      boarding_code: boardingCode,
      destination_code: destinationCode,
      journey_date: journeyDate,
      journey_time: journeyTime,
      preference,
    });
  };

  const popularRoutes = [
    { from: 'PGI', to: 'TIR', label: 'Parpanangadi → Tirur', tag: 'Fast Link' },
    { from: 'CLT', to: 'PGI', label: 'Kozhikode → Parpanangadi', tag: 'Direct Line' },
    { from: 'SRR', to: 'TPJ', label: 'Shoranur → Trichy', tag: 'Overnight' },
    { from: 'MAQ', to: 'TVC', label: 'Mangaluru → Trivandrum', tag: 'Vande Bharat' },
    { from: 'PGT', to: 'SRR', label: 'Palakkad → Shoranur', tag: 'MEMU Local' },
    { from: 'ERS', to: 'KIK', label: 'Ernakulam → Karaikal', tag: 'Express' },
    { from: 'MAS', to: 'CBE', label: 'Chennai → Coimbatore', tag: 'Superfast' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Station-Aware Availability Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Plan Your Train Journey
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          AI checks real route sequences, scheduled stops, overnight crossing, and departure times.
        </p>
      </div>

      {/* Main Search Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {validationError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Station Selection Row with Swap button */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-center">
            {/* Boarding Station Searchable Input */}
            <SearchableStationInput
              label="Boarding Junction (From)"
              dotColor="bg-amber-400"
              selectedCode={boardingCode}
              onSelect={(code) => {
                setBoardingCode(code);
                setValidationError('');
              }}
              stations={stations}
              placeholder="Type to search boarding junction (e.g. Pollachi, POU, Chennai)..."
              themeColor="amber"
            />

            {/* Swap Button */}
            <div className="flex justify-center md:pt-6">
              <button
                type="button"
                onClick={handleSwapStations}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 flex items-center justify-center transition shadow hover:scale-105 active:scale-95 cursor-pointer"
                title="Swap Boarding and Destination"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Station Searchable Input */}
            <SearchableStationInput
              label="Destination Junction (To)"
              dotColor="bg-emerald-400"
              selectedCode={destinationCode}
              onSelect={(code) => {
                setDestinationCode(code);
                setValidationError('');
              }}
              stations={stations}
              placeholder="Type to search destination junction (e.g. Kanpur, NDLS, Palani)..."
              themeColor="emerald"
            />
          </div>

          {/* Date & Time Row with "Use Current Date & Time" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Journey Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Journey Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Journey Time */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Target Departure Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="time"
                  value={journeyTime}
                  onChange={(e) => setJourneyTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Use Current Date & Time Quick Action */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleUseCurrentDateTime}
                className="w-full py-3 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400 hover:text-amber-300 transition flex items-center justify-center gap-1.5 h-[46px]"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Use Current Date & Time</span>
              </button>
            </div>
          </div>

          {/* AI Priority / User Preference Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              AI Recommendation Priority
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {(
                [
                  { id: 'Best overall', label: 'Best Overall', desc: 'Balanced metrics' },
                  { id: 'Fastest', label: 'Fastest', desc: 'Shortest duration' },
                  { id: 'Cheapest', label: 'Cheapest', desc: 'Lowest fare' },
                  { id: 'Earliest departure', label: 'Earliest', desc: 'Closest departure' },
                  { id: 'Comfortable journey', label: 'Comfortable', desc: 'High-class rakes' },
                ] as const
              ).map((pref) => {
                const isSelected = preference === pref.id;
                return (
                  <button
                    key={pref.id}
                    type="button"
                    onClick={() => setPreference(pref.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{pref.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">{pref.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Trains Button */}
          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition transform active:scale-[0.99] cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span>Search & Recommend Trains</span>
          </button>
        </form>

        {/* Preset College Corridor Shortcuts */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Frequent Test Corridors (Click to Load):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularRoutes.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setBoardingCode(r.from);
                  setDestinationCode(r.to);
                  setValidationError('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                  boardingCode === r.from && destinationCode === r.to
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>{r.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {r.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
