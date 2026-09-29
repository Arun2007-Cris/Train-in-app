import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, X, Check, Building2, ChevronDown } from 'lucide-react';
import { Station } from '../types';

interface SearchableStationInputProps {
  label: string;
  dotColor: string;
  selectedCode: string;
  onSelect: (code: string) => void;
  stations: Station[];
  placeholder?: string;
  themeColor?: 'amber' | 'emerald';
}

export const SearchableStationInput: React.FC<SearchableStationInputProps> = ({
  label,
  dotColor,
  selectedCode,
  onSelect,
  stations,
  placeholder = 'Type station name or code...',
  themeColor = 'amber',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find currently selected station object
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.station_code === selectedCode);
  }, [stations, selectedCode]);

  // Sync search input when external selection changes
  useEffect(() => {
    if (selectedStation) {
      setSearchTerm(`${selectedStation.station_name} (${selectedStation.station_code})`);
    } else {
      setSearchTerm(selectedCode || '');
    }
  }, [selectedStation, selectedCode]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset displayed text to current selection
        if (selectedStation) {
          setSearchTerm(`${selectedStation.station_name} (${selectedStation.station_code})`);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedStation]);

  // Filter stations based on search term
  const filteredStations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return stations;

    return stations.filter((st) => {
      const codeMatch = st.station_code.toLowerCase().includes(query);
      const nameMatch = st.station_name.toLowerCase().includes(query);
      const cityMatch = st.city.toLowerCase().includes(query);
      const stateMatch = st.state.toLowerCase().includes(query);
      return codeMatch || nameMatch || cityMatch || stateMatch;
    });
  }, [stations, searchTerm]);

  const handleSelectStation = (st: Station) => {
    onSelect(st.station_code);
    setSearchTerm(`${st.station_name} (${st.station_code})`);
    setIsOpen(false);
  };

  const isAmber = themeColor === 'amber';

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          {label}
        </span>
        {selectedStation && (
          <span className="text-[10px] text-slate-400 font-mono">
            {selectedStation.city}, {selectedStation.state}
          </span>
        )}
      </label>

      <div className="relative">
        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isAmber ? 'text-amber-400' : 'text-emerald-400'}`}>
          <MapPin className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-16 py-3.5 bg-slate-950 border rounded-xl text-slate-100 text-sm font-medium focus:outline-none transition shadow-inner ${
            isAmber
              ? 'border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              : 'border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
          }`}
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setIsOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown list shown below */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3 text-amber-400" />
              <span>{filteredStations.length} stations found</span>
            </span>
            <span className="text-[10px] text-slate-500">Type name, code, or city</span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {filteredStations.length > 0 ? (
              filteredStations.map((st) => {
                const isSelected = st.station_code === selectedCode;
                const isJunction = st.station_name.toLowerCase().includes('junction') || st.station_name.toLowerCase().includes('jct');

                return (
                  <button
                    key={st.station_id || st.station_code}
                    type="button"
                    onClick={() => handleSelectStation(st)}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? isAmber
                          ? 'bg-amber-500/15 text-white'
                          : 'bg-emerald-500/15 text-white'
                        : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? isAmber ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-amber-400 border border-slate-700'
                      }`}>
                        {st.station_code}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate flex items-center gap-1.5">
                          <span>{st.station_name}</span>
                          {isJunction && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Junction
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {st.city} • <span className="text-slate-500">{st.state}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className={`w-4 h-4 shrink-0 ${isAmber ? 'text-amber-400' : 'text-emerald-400'}`} />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <Building2 className="w-6 h-6 mx-auto mb-1.5 text-slate-600" />
                <p>No stations match &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-[11px] text-slate-500 mt-1">Try searching by city (e.g. Kanpur, Delhi, Pollachi) or station code</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
