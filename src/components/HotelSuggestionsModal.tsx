import React, { useState, useEffect } from 'react';
import {
  X,
  Hotel,
  Bed,
  Sparkles,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Coffee,
  Wifi,
  ExternalLink,
  Layers,
  ChevronRight,
  Home,
  Building2,
  RefreshCw,
  Info
} from 'lucide-react';
import { AccommodationSuggestion, HotelSuggestionsResult, ConnectingTrainRoute } from '../types';

interface HotelSuggestionsModalProps {
  connectingRoute?: ConnectingTrainRoute | null;
  stationCode: string;
  stationName: string;
  city?: string;
  isJunction?: boolean;
  layoverDuration?: string;
  onClose: () => void;
  onBookRoute?: () => void;
}

export const HotelSuggestionsModal: React.FC<HotelSuggestionsModalProps> = ({
  connectingRoute,
  stationCode,
  stationName,
  city = '',
  isJunction = true,
  layoverDuration,
  onClose,
  onBookRoute,
}) => {
  // If connecting route is passed, user can toggle between transfer junction and destination station!
  const hasTwoStations = !!connectingRoute;
  const junctionCode = connectingRoute?.junction_station_code || stationCode;
  const junctionName = connectingRoute?.junction_station_name || stationName;
  const destCode = connectingRoute?.leg2?.destination_stop?.station_code || 'DEST';
  const destName = connectingRoute?.leg2?.destination_stop?.station_name || 'Destination Station';
  const layover = connectingRoute?.layover_duration || layoverDuration || '1h 30m';

  const [activeStationType, setActiveStationType] = useState<'junction' | 'destination'>('junction');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'POD' | 'RETIRING' | 'HOTEL' | 'APARTMENT'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotelData, setHotelData] = useState<HotelSuggestionsResult | null>(null);
  const [bookedPropertyId, setBookedPropertyId] = useState<string | null>(null);

  const currentStationCode = activeStationType === 'junction' ? junctionCode : destCode;
  const currentStationName = activeStationType === 'junction' ? junctionName : destName;
  const currentIsJunction = activeStationType === 'junction';

  const fetchHotels = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/suggest-hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_code: currentStationCode,
          station_name: currentStationName,
          city,
          is_junction: currentIsJunction,
          layover_duration: layover,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setHotelData(data.data);
      } else {
        throw new Error(data.message || 'Could not fetch hotel suggestions');
      }
    } catch (err: any) {
      console.error('Hotel suggestion fetch error:', err);
      setError(err?.message || 'Using offline hotel recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [activeStationType, currentStationCode]);

  const filteredAccommodations = (hotelData?.accommodations || []).filter((item) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'POD') return item.category === 'IRCTC Executive Pod';
    if (selectedCategory === 'RETIRING') return item.category === 'Station Retiring Room';
    if (selectedCategory === 'HOTEL') return item.category === 'Hotel';
    if (selectedCategory === 'APARTMENT') return item.category === 'Serviced Apartment';
    return true;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'IRCTC Executive Pod':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Station Retiring Room':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Serviced Apartment':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  AI Hotel & Apartment Suggester
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Transit AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified IRCTC pods, station retiring rooms, hotels & apartments for connecting journeys
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

        {/* Location Toggle Tabs (Junction vs Destination) */}
        {hasTwoStations && (
          <div className="mt-4 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1.5 shrink-0">
            <button
              onClick={() => setActiveStationType('junction')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeStationType === 'junction'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>1. Transfer Junction ({junctionCode}) • Layover Stays</span>
            </button>
            <button
              onClick={() => setActiveStationType('destination')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeStationType === 'destination'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>2. Destination Arrival ({destCode}) • Final Stays</span>
            </button>
          </div>
        )}

        {/* Active Station Banner */}
        <div className="my-3.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2.5">
            <MapPin className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-black text-white">
                {currentStationName} ({currentStationCode})
              </span>
              <span className="text-[11px] text-slate-400 ml-2">
                {currentIsJunction ? `Transit Transfer Hub • Layover: ${layover}` : 'Destination Station'}
              </span>
            </div>
          </div>

          {currentIsJunction && (
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-bold flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Hourly Pods & Freshen-Up Available
            </span>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
          {[
            { id: 'ALL', label: 'All Stays' },
            { id: 'POD', label: '💤 IRCTC Sleeping Pods' },
            { id: 'RETIRING', label: '🏨 Station Retiring Rooms' },
            { id: 'HOTEL', label: '🏢 Transit Hotels' },
            { id: 'APARTMENT', label: '🏡 Serviced Apartments' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* AI Overview Banner */}
        {hotelData?.ai_overview && (
          <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 text-xs text-slate-300 flex items-start gap-2.5 shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">AI Transit Recommendation: </span>
              <span>{hotelData.ai_overview}</span>
            </div>
          </div>
        )}

        {/* Accommodation Cards List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-white">Analyzing station concourse & nearby lodging with AI...</p>
              <p className="text-xs text-slate-500">Checking IRCTC retiring pod availability and serviced apartments</p>
            </div>
          ) : filteredAccommodations.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-bold">No accommodations match the selected filter.</p>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="mt-2 text-xs text-amber-400 underline font-bold cursor-pointer"
              >
                View all available options
              </button>
            </div>
          ) : (
            filteredAccommodations.map((item) => {
              const isBooked = bookedPropertyId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 shadow-md space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getCategoryBadge(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.pricing_badge}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white tracking-tight">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.distance_from_station} • {item.address}</span>
                      </p>
                    </div>

                    <div className="text-right sm:self-start">
                      <div className="flex items-center sm:justify-end gap-1 text-amber-400 font-mono font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.rating}</span>
                        <span className="text-slate-500 text-[10px]">({item.review_count})</span>
                      </div>
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5">
                        {item.pricing}
                      </div>
                    </div>
                  </div>

                  {/* AI Transit Highlight */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-emerald-300">Why for Transit: </strong>
                      {item.ai_transit_highlight}
                    </span>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.amenities.map((am, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-medium"
                      >
                        {am}
                      </span>
                    ))}
                  </div>

                  {/* Booking / Action Row */}
                  <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.contact_or_booking}
                    </span>

                    <button
                      type="button"
                      onClick={() => setBookedPropertyId(isBooked ? null : item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        isBooked
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                      }`}
                    >
                      {isBooked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Transit Stay Reserved</span>
                        </>
                      ) : (
                        <>
                          <span>Reserve Transit Stay</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            <span>Powered by Official Railway Concourse Intelligence</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            {onBookRoute && (
              <button
                onClick={() => {
                  onClose();
                  onBookRoute();
                }}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                Proceed to Book Connecting Train
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
