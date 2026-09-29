import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Filter,
  Scale,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Train,
  Clock,
  MapPin,
  Calendar,
  Zap,
  Info,
  GitFork,
  ArrowRight,
  Bed
} from 'lucide-react';
import {
  SearchResultTrain,
  UnavailableTrain,
  UserPreference,
  SearchTrainsRequest,
  ConnectingTrainRoute
} from '../types';
import { TrainCard } from './TrainCard';
import { ConnectingTrainCard } from './ConnectingTrainCard';
import { FiltersBar } from './FiltersBar';
import { CompareConnectingModal } from './CompareConnectingModal';
import { HotelSuggestionsModal } from './HotelSuggestionsModal';

interface RecommendationPageProps {
  query: SearchTrainsRequest;
  availableTrains: SearchResultTrain[];
  connectingTrains?: ConnectingTrainRoute[];
  unavailableTrains: UnavailableTrain[];
  isLoading: boolean;
  onEditSearch: () => void;
  onViewDetails: (train: SearchResultTrain) => void;
  onBookTrain: (train: SearchResultTrain) => void;
  onOpenCompareModal: (trains: SearchResultTrain[]) => void;
  onPreferenceChange: (preference: UserPreference) => void;
  onBookConnectingTrain?: (route: ConnectingTrainRoute) => void;
  onViewConnectingRoute?: (route: ConnectingTrainRoute) => void;
  onOpenCopilot?: (route?: ConnectingTrainRoute) => void;
}

export const RecommendationPage: React.FC<RecommendationPageProps> = ({
  query,
  availableTrains,
  connectingTrains = [],
  unavailableTrains,
  isLoading,
  onEditSearch,
  onViewDetails,
  onBookTrain,
  onOpenCompareModal,
  onPreferenceChange,
  onBookConnectingTrain,
  onViewConnectingRoute,
  onOpenCopilot,
}) => {
  // Compare selection state for direct trains (up to 3 trains)
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  
  // Compare selection state for connecting routes (up to 3 routes)
  const [selectedConnectingForCompare, setSelectedConnectingForCompare] = useState<string[]>([]);
  const [isConnectingCompareOpen, setIsConnectingCompareOpen] = useState(false);
  const [activeHotelRoute, setActiveHotelRoute] = useState<ConnectingTrainRoute | null>(null);

  const [showUnavailable, setShowUnavailable] = useState(false);

  // Tab: 'direct' or 'connecting'
  const [activeRouteTab, setActiveRouteTab] = useState<'direct' | 'connecting'>(() => {
    return availableTrains.length > 0 ? 'direct' : 'connecting';
  });

  // Automatically switch to connecting if no direct trains exist
  React.useEffect(() => {
    if (availableTrains.length === 0 && connectingTrains.length > 0) {
      setActiveRouteTab('connecting');
    }
  }, [availableTrains.length, connectingTrains.length]);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');

  const handleToggleCompare = (train: SearchResultTrain) => {
    if (selectedForCompare.includes(train.train_id)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== train.train_id));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can compare a maximum of 3 trains simultaneously.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, train.train_id]);
    }
  };

  const handleToggleConnectingCompare = (route: ConnectingTrainRoute) => {
    if (selectedConnectingForCompare.includes(route.connection_id)) {
      setSelectedConnectingForCompare(selectedConnectingForCompare.filter((id) => id !== route.connection_id));
    } else {
      if (selectedConnectingForCompare.length >= 3) {
        alert('You can compare a maximum of 3 connecting routes simultaneously.');
        return;
      }
      setSelectedConnectingForCompare([...selectedConnectingForCompare, route.connection_id]);
    }
  };

  const handleCompareWithAI = (route: ConnectingTrainRoute) => {
    if (!selectedConnectingForCompare.includes(route.connection_id)) {
      const other = connectingTrains.find((r) => r.connection_id !== route.connection_id);
      const newSelection = other ? [route.connection_id, other.connection_id] : [route.connection_id];
      setSelectedConnectingForCompare(newSelection);
    }
    setIsConnectingCompareOpen(true);
  };

  const handleOpenHotels = (route: ConnectingTrainRoute) => {
    setActiveHotelRoute(route);
  };

  // Filter available direct trains based on category (Train Type) and class (including Sleeper)
  const filteredAvailableTrains = useMemo(() => {
    return availableTrains.filter((train) => {
      if (selectedCategory !== 'All' && train.train_type !== selectedCategory) {
        return false;
      }
      if (selectedClass !== 'All') {
        const matchesClass = train.calculated_classes?.some((c) => {
          if (selectedClass === 'Sleeper') {
            return (
              c.class_name === 'Sleeper' ||
              c.class_name.toLowerCase().includes('sleeper') ||
              c.class_name.includes('SL')
            );
          }
          if (selectedClass === 'AC Compartment') {
            return c.class_name.includes('AC') || c.class_name.includes('Tier');
          }
          if (selectedClass === 'Chair Car') {
            return c.class_name.includes('Chair Car') || (c.class_name as string) === 'CC';
          }
          return c.class_name.toLowerCase().includes(selectedClass.toLowerCase());
        });
        if (!matchesClass) return false;
      }
      return true;
    });
  }, [availableTrains, selectedCategory, selectedClass]);

  // Filter connecting trains based on category (Train Type) and class (including Sleeper)
  const filteredConnectingTrains = useMemo(() => {
    return connectingTrains.filter((route) => {
      if (selectedCategory !== 'All') {
        const matchesType =
          route.leg1.train_type === selectedCategory ||
          route.leg2.train_type === selectedCategory;
        if (!matchesType) return false;
      }
      if (selectedClass !== 'All') {
        const checkClass = (c: any) => {
          if (selectedClass === 'Sleeper') {
            return (
              c.class_name === 'Sleeper' ||
              c.class_name.toLowerCase().includes('sleeper') ||
              c.class_name.includes('SL')
            );
          }
          if (selectedClass === 'AC Compartment') {
            return c.class_name.includes('AC') || c.class_name.includes('Tier');
          }
          if (selectedClass === 'Chair Car') {
            return c.class_name.includes('Chair Car') || (c.class_name as string) === 'CC';
          }
          return c.class_name.toLowerCase().includes(selectedClass.toLowerCase());
        };

        const leg1Matches = route.leg1.calculated_classes?.some(checkClass);
        const leg2Matches = route.leg2.calculated_classes?.some(checkClass);
        if (!leg1Matches && !leg2Matches) return false;
      }
      return true;
    });
  }, [connectingTrains, selectedCategory, selectedClass]);

  const comparedTrainObjects = useMemo(() => {
    return availableTrains.filter((t) => selectedForCompare.includes(t.train_id));
  }, [availableTrains, selectedForCompare]);

  // Check if there are no direct trains for this corridor or filter
  const hasNoDirectTrains = availableTrains.length === 0;
  const hasNoFilteredDirectTrains = filteredAvailableTrains.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      {/* Search Itinerary Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onEditSearch}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-slate-700 cursor-pointer"
            title="Modify Search"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {query.journey_date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Dep: {query.journey_time}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>{query.boarding_code}</span>
              <span className="text-amber-400">➔</span>
              <span>{query.destination_code}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedForCompare.length > 0 && (
            <button
              onClick={() => onOpenCompareModal(comparedTrainObjects)}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer animate-pulse"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Direct ({selectedForCompare.length})</span>
            </button>
          )}

          {selectedConnectingForCompare.length > 0 && (
            <button
              onClick={() => setIsConnectingCompareOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Compare Connecting ({selectedConnectingForCompare.length})</span>
            </button>
          )}

          <button
            onClick={onEditSearch}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            Modify Search
          </button>
        </div>
      </div>

      {/* Route Type Tabs: Direct vs Connecting Trains */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveRouteTab('direct')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeRouteTab === 'direct'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Train className="w-4 h-4" />
            <span>Direct Trains ({filteredAvailableTrains.length})</span>
          </button>

          <button
            onClick={() => setActiveRouteTab('connecting')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeRouteTab === 'connecting'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitFork className="w-4 h-4 rotate-90" />
            <span>Connecting Trains ({filteredConnectingTrains.length})</span>
            {filteredConnectingTrains.length > 0 && availableTrains.length === 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-950 text-amber-300 font-extrabold">
                Recommended
              </span>
            )}
          </button>
        </div>

        {activeRouteTab === 'connecting' && (
          <div className="text-xs text-slate-400 flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-leg transit via interchange junction halts with segment dates</span>
          </div>
        )}
      </div>

      {/* Filters Bar: Train Type, Sleeper/Class, and AI Preferences */}
      <FiltersBar
        selectedPreference={query.preference || 'Best overall'}
        onSelectPreference={onPreferenceChange}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedClass={selectedClass}
        onSelectClass={setSelectedClass}
        onResetFilters={() => {
          setSelectedCategory('All');
          setSelectedClass('All');
          onPreferenceChange('Best overall');
        }}
        totalAvailable={
          activeRouteTab === 'direct' && !hasNoDirectTrains
            ? filteredAvailableTrains.length
            : filteredConnectingTrains.length
        }
      />

      {/* Main Results View */}
      <div className="space-y-5 mb-10">
        {isLoading ? (
          <div className="p-16 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-white">
              Evaluating Railway Stops & Computing AI Rankings...
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Checking station schedules, overnight route transitions, connecting hubs, and live telemetry feeds.
            </p>
          </div>
        ) : hasNoDirectTrains ? (
          /* =========================================================================
             RULE: If there are NO direct trains through destination:
             Show "there is no trains available here" in description, AFTER that show the connected trains!
             ========================================================================= */
          <div className="space-y-6">
            {/* Prominent Description Notice as requested */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/15 border-2 border-amber-500/40 shadow-xl">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      No Direct Trains Available
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                      {filteredConnectingTrains.length} Connected Routes Available
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                    There are <strong className="text-white font-bold">no direct trains available here</strong> between{' '}
                    <span className="text-amber-400 font-bold">{query.boarding_code}</span> and{' '}
                    <span className="text-amber-400 font-bold">{query.destination_code}</span> on{' '}
                    <span className="text-slate-100 font-semibold">{query.journey_date}</span>.
                    However, you can travel comfortably with connecting trains via interchange stations with guaranteed layover buffers.
                    The connected trains available for your destination are shown below:
                  </p>
                </div>
              </div>
            </div>

            {/* AFTER: Show the connected trains */}
            <div className="space-y-5">
              {filteredConnectingTrains.length > 0 ? (
                filteredConnectingTrains.map((route) => (
                  <ConnectingTrainCard
                    key={route.connection_id}
                    route={route}
                    journeyDate={query.journey_date}
                    isSelectedForCompare={selectedConnectingForCompare.includes(route.connection_id)}
                    onToggleCompare={handleToggleConnectingCompare}
                    onCompareWithAI={handleCompareWithAI}
                    onOpenHotels={handleOpenHotels}
                    onBook={(r) => {
                      if (onBookConnectingTrain) {
                        onBookConnectingTrain(r);
                      } else {
                        onBookTrain(r.leg1);
                      }
                    }}
                    onViewConnectedRoute={(r) => {
                      if (onViewConnectingRoute) {
                        onViewConnectingRoute(r);
                      } else {
                        onViewDetails(r.leg1);
                      }
                    }}
                    onOpenCopilot={onOpenCopilot}
                  />
                ))
              ) : (
                <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
                  <h4 className="text-sm font-bold text-white">
                    No connecting trains match the selected filter ({selectedCategory} / {selectedClass})
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Clear the filter to see all {connectingTrains.length} available connecting options.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedClass('All');
                    }}
                    className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeRouteTab === 'direct' && hasNoFilteredDirectTrains ? (
          /* When direct trains exist in general, but user filtered to category/class with 0 direct:
             Show description that direct trains are not available for this filter, after show connected trains! */
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border-2 border-amber-500/40 shadow-xl">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      No Direct Trains Available For Selected Filter
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                      Connected Routes Available Below
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                    There are <strong className="text-white font-bold">no direct trains available here</strong> matching{' '}
                    <span className="text-amber-400 font-bold">{selectedCategory !== 'All' ? selectedCategory : ''} {selectedClass !== 'All' ? selectedClass : ''}</span>{' '}
                    between <span className="text-amber-400 font-bold">{query.boarding_code}</span> and{' '}
                    <span className="text-amber-400 font-bold">{query.destination_code}</span>.
                    You can take the connected trains shown below:
                  </p>
                </div>
              </div>
            </div>

            {/* AFTER: Show the connected trains */}
            <div className="space-y-5">
              {filteredConnectingTrains.length > 0 ? (
                filteredConnectingTrains.map((route) => (
                  <ConnectingTrainCard
                    key={route.connection_id}
                    route={route}
                    journeyDate={query.journey_date}
                    isSelectedForCompare={selectedConnectingForCompare.includes(route.connection_id)}
                    onToggleCompare={handleToggleConnectingCompare}
                    onCompareWithAI={handleCompareWithAI}
                    onOpenHotels={handleOpenHotels}
                    onBook={(r) => {
                      if (onBookConnectingTrain) {
                        onBookConnectingTrain(r);
                      } else {
                        onBookTrain(r.leg1);
                      }
                    }}
                    onViewConnectedRoute={(r) => {
                      if (onViewConnectingRoute) {
                        onViewConnectingRoute(r);
                      } else {
                        onViewDetails(r.leg1);
                      }
                    }}
                    onOpenCopilot={onOpenCopilot}
                  />
                ))
              ) : (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                  <p className="text-xs text-slate-400">
                    No connecting trains found for this specific filter.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedClass('All');
                    }}
                    className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeRouteTab === 'connecting' ? (
          /* Connecting Trains Tab View */
          <div className="space-y-5">
            {filteredConnectingTrains.length > 0 ? (
              filteredConnectingTrains.map((route) => (
                <ConnectingTrainCard
                  key={route.connection_id}
                  route={route}
                  journeyDate={query.journey_date}
                  isSelectedForCompare={selectedConnectingForCompare.includes(route.connection_id)}
                  onToggleCompare={handleToggleConnectingCompare}
                  onCompareWithAI={handleCompareWithAI}
                  onOpenHotels={handleOpenHotels}
                  onBook={(r) => {
                    if (onBookConnectingTrain) {
                      onBookConnectingTrain(r);
                    } else {
                      onBookTrain(r.leg1);
                    }
                  }}
                  onViewConnectedRoute={(r) => {
                    if (onViewConnectingRoute) {
                      onViewConnectingRoute(r);
                    } else {
                      onViewDetails(r.leg1);
                    }
                  }}
                  onOpenCopilot={onOpenCopilot}
                />
              ))
            ) : (
              <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-white">
                  No connecting trains match filter ({selectedCategory} / {selectedClass})
                </h4>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedClass('All');
                  }}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Direct Trains List */
          <div className="space-y-5">
            {filteredAvailableTrains.map((train) => (
              <TrainCard
                key={train.train_id}
                train={train}
                boardingCode={query.boarding_code}
                destinationCode={query.destination_code}
                journeyDate={query.journey_date}
                isCompared={selectedForCompare.includes(train.train_id)}
                onToggleCompare={handleToggleCompare}
                onViewDetails={onViewDetails}
                onBookTrain={onBookTrain}
              />
            ))}
          </div>
        )}
      </div>

      {/* Unavailable Trains Section */}
      {unavailableTrains.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
          <button
            onClick={() => setShowUnavailable(!showUnavailable)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  Station-Aware Inactive Trains ({unavailableTrains.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Trains scheduled on this corridor that do not serve this specific stop pair or already departed.
                </p>
              </div>
            </div>
            {showUnavailable ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showUnavailable && (
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
              {unavailableTrains.map((unTrain) => (
                <div
                  key={unTrain.train_id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-amber-400 font-bold">
                        #{unTrain.train_number}
                      </span>
                      <span className="font-bold text-white">{unTrain.train_name}</span>
                    </div>
                    <span className="text-[11px] text-rose-400/90 block mt-0.5">
                      {unTrain.reason_text}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                    {unTrain.train_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advanced AI Connecting Route Comparison Modal */}
      {isConnectingCompareOpen && (
        <CompareConnectingModal
          routes={
            selectedConnectingForCompare.length > 0
              ? connectingTrains.filter((r) => selectedConnectingForCompare.includes(r.connection_id))
              : connectingTrains.slice(0, 3)
          }
          onClose={() => setIsConnectingCompareOpen(false)}
          onBook={(route) => {
            setIsConnectingCompareOpen(false);
            if (onBookConnectingTrain) {
              onBookConnectingTrain(route);
            } else {
              onBookTrain(route.leg1);
            }
          }}
          onRemove={(connId) => {
            setSelectedConnectingForCompare((prev) => prev.filter((id) => id !== connId));
          }}
          onOpenHotels={(route) => {
            setIsConnectingCompareOpen(false);
            setActiveHotelRoute(route);
          }}
        />
      )}

      {/* AI Hotel, Apartment & Sleeping Pod Suggestions Modal */}
      {activeHotelRoute && (
        <HotelSuggestionsModal
          connectingRoute={activeHotelRoute}
          stationCode={activeHotelRoute.junction_station_code}
          stationName={activeHotelRoute.junction_station_name}
          city={activeHotelRoute.junction_station_name}
          layoverDuration={activeHotelRoute.layover_duration}
          onClose={() => setActiveHotelRoute(null)}
          onBookRoute={() => {
            const r = activeHotelRoute;
            setActiveHotelRoute(null);
            if (onBookConnectingTrain) {
              onBookConnectingTrain(r);
            } else {
              onBookTrain(r.leg1);
            }
          }}
        />
      )}
    </div>
  );
};
