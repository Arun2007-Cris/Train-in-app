import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Train,
  Navigation,
  Download,
  Hotel,
  Ticket,
  DollarSign,
  ArrowRight,
  GitCompare,
  Building2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SearchResultTrain, Booking, ConnectingTrainRoute, Station } from '../types';
import { railwayIntelligenceService, ParsedRailwayQuery } from '../services/railwayIntelligenceService';
import { storageService } from '../services/storageService';
import { STATIONS } from '../../server/railwayData';

interface CopilotCardData {
  type: 'TRAINS_LIST' | 'TRAIN_COMPARISON' | 'HOTELS_LIST' | 'TICKET_BRIEF' | 'STOPS_LIST' | 'train_recommendations';
  trains?: any[];
  recommendations?: any;
  sourceStation?: { name: string; code: string };
  destinationStation?: { name: string; code: string };
  explanation?: string;
  comparison?: { table: Array<{ feature: string; train1: string; train2: string }>; analysis: string };
  hotels?: any[];
  ticket?: Booking;
  stops?: Array<{ station_name: string; station_code: string; distance_km: number }>;
  passengerCount?: number;
}

interface EnhancedMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  quickActions?: string[];
  cards?: CopilotCardData;
}

interface AiTrainCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  train?: SearchResultTrain | null;
  booking?: Booking | null;
  connectingRoute?: ConnectingTrainRoute | null;
  journeyDate?: string;
  onBookTrain?: (train: SearchResultTrain) => void;
  onViewTrainDetails?: (train: SearchResultTrain) => void;
  onTrackTrain?: (train: SearchResultTrain) => void;
  onViewTicket?: (ticket: Booking) => void;
  onOpenHotels?: (stationCode: string, stationName: string) => void;
}

export const AiTrainCopilot: React.FC<AiTrainCopilotProps> = ({
  isOpen,
  onClose,
  train,
  booking,
  connectingRoute,
  journeyDate,
  onBookTrain,
  onViewTrainDetails,
  onTrackTrain,
  onViewTicket,
  onOpenHotels,
}) => {
  // Conversational Context Memory
  const [contextSource, setContextSource] = useState<Station | undefined>(undefined);
  const [contextDest, setContextDest] = useState<Station | undefined>(undefined);
  const [contextPassengers, setContextPassengers] = useState<number>(1);
  const [contextPreference, setContextPreference] = useState<'Cheapest' | 'Fastest' | 'Earliest departure' | 'Comfortable' | 'Best overall'>('Best overall');
  const [contextLastTrains, setContextLastTrains] = useState<any[]>([]);
  const [contextReferencedTrain, setContextReferencedTrain] = useState<any | null>(null);

  const [messages, setMessages] = useState<EnhancedMessage[]>(() => {
    const saved = storageService.getCopilotHistory();
    if (saved && saved.length > 0) return saved;

    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello! I am your **Railway AI Copilot** for TrainInApp.\n\nI understand natural language railway queries, route sequencing, fare calculations, live status, and accommodation near junctions. How can I assist your journey?`,
        timestamp: 'Just now',
        quickActions: [
          '🚆 Trichy to Coimbatore tomorrow',
          '💰 Find the cheapest train',
          '⚡ Which train is fastest?',
          '📍 Where is my train now?',
          '🏨 Hotels near Trichy Junction',
          '🎫 Show my booked ticket',
        ],
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist history to storage
  useEffect(() => {
    if (messages.length > 0) {
      storageService.saveCopilotHistory(messages);
    }
  }, [messages]);

  // Initialize context from props if available
  useEffect(() => {
    if (train?.boarding_stop) {
      const src = STATIONS.find((s) => s.station_code === train.boarding_stop.station_code);
      if (src) setContextSource(src);
    }
    if (train?.destination_stop) {
      const dst = STATIONS.find((s) => s.station_code === train.destination_stop.station_code);
      if (dst) setContextDest(dst);
    }
    if (booking) {
      const src = STATIONS.find((s) => s.station_code === booking.boarding_station_code);
      const dst = STATIONS.find((s) => s.station_code === booking.destination_station_code);
      if (src) setContextSource(src);
      if (dst) setContextDest(dst);
      if (booking.passenger_count) setContextPassengers(booking.passenger_count);
    }
  }, [train, booking]);

  if (!isOpen) return null;

  const handleClearHistory = () => {
    storageService.clearCopilotHistory();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `Conversation cleared. I am ready for your next journey query. Try asking:\n• "Trains from Shoranur to Trichy for 3 people"\n• "Hotels near Shoranur Junction"\n• "Which train is fastest?"`,
        timestamp: 'Just now',
        quickActions: [
          '🚆 Trichy to Coimbatore',
          '⚡ Fastest train',
          '💰 Cheapest sleeper',
          '🏨 Hotels near Trichy Junction',
        ],
      },
    ]);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: EnhancedMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      // 1. Parse query with railway intelligence
      const parsed = railwayIntelligenceService.parseQuery(textToSend, {
        source: contextSource,
        destination: contextDest,
        lastTrains: contextLastTrains,
        activeBooking: booking || storageService.getActiveBooking(),
      });

      // Update contextual memory
      if (parsed.sourceStation) setContextSource(parsed.sourceStation);
      if (parsed.destinationStation) setContextDest(parsed.destinationStation);
      if (parsed.passengerCount) setContextPassengers(parsed.passengerCount);
      if (parsed.preference) setContextPreference(parsed.preference);

      const effectiveSource = parsed.sourceStation || contextSource;
      const effectiveDest = parsed.destinationStation || contextDest;
      const effectivePassengers = parsed.passengerCount || contextPassengers || 1;
      const effectivePref = parsed.preference || contextPreference || 'Best overall';

      // 2. Handle specific railway intents

      // A. View Booked Ticket
      if (parsed.intent === 'VIEW_TICKET' || parsed.intent === 'PRINT_TICKET') {
        const activeBk = booking || storageService.getActiveBooking();
        if (activeBk) {
          const aiReply: EnhancedMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `Here is your confirmed railway reservation for **PNR #${activeBk.pnr}** (${activeBk.train_name}). You can view details, print, or download your e-ticket directly:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cards: {
              type: 'TICKET_BRIEF',
              ticket: activeBk,
            },
            quickActions: [
              '📍 Where is my train now?',
              '🏨 Hotels near destination',
              '🚆 Plan another train journey',
            ],
          };
          setMessages((prev) => [...prev, aiReply]);
          setIsLoading(false);
          return;
        } else {
          const aiReply: EnhancedMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `You do not have an active confirmed reservation in this session yet. Would you like me to find available trains for you? Try asking: *"Find trains from Shoranur to Trichy"*.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: [
              '🚆 Shoranur to Trichy',
              '🚆 Chennai to Coimbatore',
              '🚆 Mangaluru to Trivandrum',
            ],
          };
          setMessages((prev) => [...prev, aiReply]);
          setIsLoading(false);
          return;
        }
      }

      // B. Hotels / Accommodation Near Junction
      if (parsed.intent === 'HOTELS_NEAR_JUNCTION') {
        const targetStn = parsed.targetStation || effectiveDest || effectiveSource || { station_code: 'TPJ', station_name: 'Tiruchchirappalli Junction', city: 'Tiruchirappalli' };
        
        // Fetch hotels from backend API
        let hotelsList: any[] = [];
        try {
          const res = await fetch('/api/suggest-hotels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              station_code: targetStn.station_code,
              station_name: targetStn.station_name,
              city: (targetStn as any).city || targetStn.station_name,
              is_junction: true,
              layover_duration: '1h 30m',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
              hotelsList = [
                ...(data.data.retiring_rooms || []),
                ...(data.data.station_pod_capsules || []),
                ...(data.data.budget_hotels || []),
                ...(data.data.premium_hotels || []),
                ...(data.data.serviced_apartments || []),
              ].slice(0, 4);
            }
          }
        } catch {
          // Fallback mock properties
          hotelsList = [
            { property_id: 'h1', property_name: `Railway Retiring Executive Rooms`, category: 'RETIRING', distance_meters: 50, distance_display: '50m (On Platform 1)', approximate_price_inr: 850, rating: 4.5, address: `Platform 1, ${targetStn.station_name}` },
            { property_id: 'h2', property_name: `Grand Junction Residency`, category: 'HOTEL', distance_meters: 250, distance_display: '250m from East Exit', approximate_price_inr: 1450, rating: 4.3, address: `Station Road, near ${targetStn.station_name}` },
            { property_id: 'h3', property_name: `Railway Transit Pods`, category: 'POD', distance_meters: 80, distance_display: '80m (Waiting Hall)', approximate_price_inr: 490, rating: 4.7, address: `AC Concourse, ${targetStn.station_name}` },
          ];
        }

        const aiReply: EnhancedMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Found verified accommodation options near **${targetStn.station_name} (${targetStn.station_code})**. All properties are located within walking distance of the station platforms:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cards: {
            type: 'HOTELS_LIST',
            hotels: hotelsList,
          },
          quickActions: [
            `🚆 Trains arriving at ${targetStn.station_code}`,
            '📍 Live station status',
            '🎫 View my ticket',
          ],
        };
        setMessages((prev) => [...prev, aiReply]);
        setIsLoading(false);
        return;
      }

      // C. Intermediate Stops Question
      if (parsed.intent === 'INTERMEDIATE_STOPS' && effectiveSource && effectiveDest) {
        const stops = railwayIntelligenceService.getIntermediateStops(effectiveSource.station_code, effectiveDest.station_code);
        if (stops.length > 0) {
          const aiReply: EnhancedMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `Here is the official station halt sequence between **${effectiveSource.station_name}** and **${effectiveDest.station_name}** in route order (${stops.length} stations):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cards: {
              type: 'STOPS_LIST',
              stops,
            },
            quickActions: [
              `⚡ Fastest train from ${effectiveSource.station_code} to ${effectiveDest.station_code}`,
              `💰 Cheapest fare for ${effectivePassengers} pax`,
              '📍 Live train location',
            ],
          };
          setMessages((prev) => [...prev, aiReply]);
          setIsLoading(false);
          return;
        }
      }

      // D. Compare Trains
      if (parsed.intent === 'COMPARE_TRAINS' && contextLastTrains.length >= 2) {
        const comp = railwayIntelligenceService.compareTwoTrains(contextLastTrains[0], contextLastTrains[1], effectivePassengers);
        const aiReply: EnhancedMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Here is a factual head-to-head comparison between **#${contextLastTrains[0].train_number} ${contextLastTrains[0].train_name}** and **#${contextLastTrains[1].train_number} ${contextLastTrains[1].train_name}** for ${effectivePassengers} passenger(s):\n\n💡 **AI Verdict:** ${comp.analysis}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cards: {
            type: 'TRAIN_COMPARISON',
            comparison: comp,
            passengerCount: effectivePassengers,
          },
          quickActions: [
            `Book #${contextLastTrains[0].train_number}`,
            `Book #${contextLastTrains[1].train_number}`,
            '💰 Calculate Sleeper Fare',
          ],
        };
        setMessages((prev) => [...prev, aiReply]);
        setIsLoading(false);
        return;
      }

      // E. Live Train Status
      if (parsed.intent === 'LIVE_STATUS') {
        const targetTrain = train || contextLastTrains[0];
        if (targetTrain) {
          const status = targetTrain.live_status?.status || 'On Time';
          const speed = targetTrain.live_status?.speed || 95;
          const curr = targetTrain.live_status?.current_station || targetTrain.boarding_stop?.station_name || 'Approaching Junction';
          const next = targetTrain.live_status?.next_station || targetTrain.destination_stop?.station_name || 'Destination Junction';
          const delay = targetTrain.live_status?.delay_minutes || 0;

          const aiReply: EnhancedMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `📍 **Live GPS Telemetry for #${targetTrain.train_number} ${targetTrain.train_name}:**\n\n• **Current Location:** Near ${curr}\n• **Speed:** ${speed} km/h\n• **Next Station:** ${next}\n• **Punctuality Status:** ${delay === 0 ? '🟢 Running On Time' : `⚠️ Running ${delay} mins late`}\n• **Scheduled Arrival:** ${targetTrain.arrival_time || targetTrain.destination_stop?.arrival_time || 'On schedule'}\n\nYou can track the full vertical route in real-time below:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cards: {
              type: 'TRAINS_LIST',
              trains: [targetTrain],
              passengerCount: effectivePassengers,
            },
            quickActions: [
              '📍 Open Vertical Route Tracker',
              '🏨 Hotels near destination',
              '🎫 Show my booked ticket',
            ],
          };
          setMessages((prev) => [...prev, aiReply]);
          setIsLoading(false);
          return;
        }
      }

      // F. Automatic Train Recommendation & Journey Copilot (Unified Flow)
      const res = await fetch('/api/ai/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: textToSend,
            context: {
              train,
              booking: booking || storageService.getActiveBooking(),
              connectingRoute,
              journeyDate: parsed.dateStr || journeyDate,
              journeyTime: parsed.timeStr,
              source: effectiveSource,
              destination: effectiveDest,
              sourceStation: effectiveSource,
              destinationStationObj: effectiveDest,
              boardingStation: effectiveSource?.station_name,
              destinationStation: effectiveDest?.station_name,
              passengerCount: effectivePassengers,
              preference: effectivePref,
              lastTrains: contextLastTrains,
              referencedTrain: contextReferencedTrain,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();

          // 1. Handle ACTION_BOOK_TRAIN
          if (data.type === 'ACTION_BOOK_TRAIN' && data.referencedTrain) {
            const targetTrain = data.referencedTrain;
            setContextReferencedTrain(targetTrain);
            const aiMsg: EnhancedMessage = {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: data.answer || data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quickActions: data.quickSuggestions,
            };
            setMessages((prev) => [...prev, aiMsg]);
            if (onBookTrain) {
              setTimeout(() => {
                onBookTrain(targetTrain);
                onClose();
              }, 400);
            }
            setIsLoading(false);
            return;
          }

          // 2. Handle train_recommendations
          if (data.type === 'train_recommendations') {
            if (data.trains && data.trains.length > 0) {
              const rawList = data.trains.map((t: any) => t.rawTrain || t);
              setContextLastTrains(rawList);
              const refTrain = data.referencedTrain || rawList[0];
              setContextReferencedTrain(refTrain);

              if (data.sourceStation?.code) {
                const s = STATIONS.find((stn) => stn.station_code === data.sourceStation.code);
                if (s) setContextSource(s);
              }
              if (data.destinationStation?.code) {
                const d = STATIONS.find((stn) => stn.station_code === data.destinationStation.code);
                if (d) setContextDest(d);
              }

              const aiReply: EnhancedMessage = {
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: data.answer || data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                cards: {
                  type: 'train_recommendations',
                  trains: data.trains,
                  recommendations: data.recommendations,
                  sourceStation: data.sourceStation,
                  destinationStation: data.destinationStation,
                  explanation: data.explanation,
                  passengerCount: effectivePassengers,
                },
                quickActions: data.quickSuggestions || [
                  '⚡ Which one is fastest?',
                  '💰 What is its fare?',
                  '🎫 Book that one',
                  `🏨 Hotels near ${data.destinationStation?.name || 'destination'}`,
                ],
              };
              setMessages((prev) => [...prev, aiReply]);
              setIsLoading(false);
              return;
            } else {
              // No direct trains found
              const aiReply: EnhancedMessage = {
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: data.answer || data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                quickActions: data.quickSuggestions || [
                  '🔄 Search connecting routes',
                  '📅 Try another date',
                  '🏨 Hotels near destination',
                ],
              };
              setMessages((prev) => [...prev, aiReply]);
              setIsLoading(false);
              return;
            }
          }

          // 3. General or clarification response
          const aiMsg: EnhancedMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: data.answer || data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: data.quickSuggestions,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsLoading(false);
          return;
        } else {
          throw new Error('Fallback triggered');
        }
      } catch {
        // Local intelligence fallback
        const details = railwayIntelligenceService.extractJourneyDetails(textToSend, {
          source: contextSource,
          destination: contextDest,
          passengerCount: contextPassengers,
          preference: contextPreference,
          lastTrains: contextLastTrains,
          referencedTrain: contextReferencedTrain,
        });

        if (details.sourceStation && details.destinationStation) {
          const localMatches = railwayIntelligenceService.searchTrains({
            sourceCode: details.sourceStation.station_code,
            destCode: details.destinationStation.station_code,
            date: details.journeyDate,
            time: details.journeyTime,
            passengerCount: details.passengerCount,
            preference: details.preference,
          });

          const recResult = railwayIntelligenceService.recommendTrains(localMatches, {
            preference: details.preference,
            queryTime: details.journeyTime,
            passengerCount: details.passengerCount,
            sourceStation: details.sourceStation,
            destinationStation: details.destinationStation,
          });

          if (recResult.trains.length > 0) {
            setContextLastTrains(localMatches);
            setContextReferencedTrain(localMatches[0]);
            setContextSource(details.sourceStation);
            setContextDest(details.destinationStation);

            const aiReply: EnhancedMessage = {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: `Based on your journey from **${details.sourceStation.station_name} (${details.sourceStation.station_code})** to **${details.destinationStation.station_name} (${details.destinationStation.station_code})**, I found **${localMatches.length} suitable train(s)**.\n\n${recResult.explanation}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              cards: {
                type: 'train_recommendations',
                trains: recResult.trains,
                recommendations: recResult.recommendations,
                sourceStation: recResult.source,
                destinationStation: recResult.destination,
                passengerCount: details.passengerCount,
              },
              quickActions: [
                '⚡ Which one is fastest?',
                '💰 What is its fare?',
                '🎫 Book that one',
                `🏨 Hotels near ${details.destinationStation.station_name}`,
              ],
            };
            setMessages((prev) => [...prev, aiReply]);
            return;
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            sender: 'ai',
            text: `I'm here to help with all TrainInApp features! You can search trains across 74 stations, check live GPS telemetry, print/download tickets, calculate group fares, and view hotels near junctions. What would you like to plan?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: [
              '🚆 Shoranur to Trichy',
              '⚡ Fastest train to Coimbatore',
              '🏨 Hotels near Trichy Junction',
              '🎫 View my booked ticket',
            ],
          },
        ]);
      } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col h-[700px] max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-white">
                  TrainInApp Modern AI Copilot
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[340px]">
                {contextSource && contextDest
                  ? `${contextSource.station_code} ➔ ${contextDest.station_code} (${contextPassengers} pax • ${contextPreference})`
                  : 'Natural language train search, fares, live status & hotels'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleClearHistory}
              title="Clear conversation history"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition cursor-pointer text-xs flex items-center gap-1 px-2.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Clear</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                }`}
              >
                <div className="whitespace-pre-line text-xs">{msg.text}</div>

                {/* Structured Cards (Train recommendations, Train results, Hotels, Ticket, Comparison) */}
                {msg.cards && (
                  <div className="mt-3.5 space-y-2.5">
                    {/* 0. AI Automatic Train Recommendations */}
                    {msg.cards.type === 'train_recommendations' && msg.cards.trains && (
                      <div className="space-y-3">
                        {msg.cards.trains.map((t: any, idx: number) => {
                          const isTopRec = t.category?.includes('RECOMMENDED');
                          const isFastest = t.category?.includes('FASTEST');
                          const isCheapest = t.category?.includes('LOWEST FARE') || t.category?.includes('CHEAPEST');
                          const isEarliest = t.category?.includes('EARLIEST');
                          const isComfortable = t.category?.includes('COMFORTABLE');

                          const badgeStyle = isTopRec
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isFastest
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : isCheapest
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isEarliest
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : isComfortable
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700';

                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-2xl bg-slate-900 border transition-all duration-200 shadow-md ${
                                isTopRec
                                  ? 'border-amber-500/50 shadow-amber-500/5 ring-1 ring-amber-500/20'
                                  : 'border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {/* Category Header */}
                              {t.category && (
                                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                                    {t.category}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                    {t.status || 'On Time'}
                                  </span>
                                </div>
                              )}

                              {/* Train Name & Number */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-black text-amber-400 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                      #{t.trainNumber || t.train_number}
                                    </span>
                                    <h4 className="font-bold text-white text-xs sm:text-sm">
                                      {t.trainName || t.train_name}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {t.trainType || t.train_type} • Runs {t.runningDays || 'Daily'}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 block">FARE</span>
                                  <span className="font-mono font-extrabold text-amber-400 text-sm">{t.fare}</span>
                                </div>
                              </div>

                              {/* Journey Route & Timing */}
                              <div className="grid grid-cols-3 gap-2 my-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/70 text-center font-mono">
                                <div className="text-left">
                                  <span className="text-[9px] text-slate-400 block font-sans">FROM</span>
                                  <span className="text-white font-bold text-xs">{t.departure}</span>
                                  <span className="text-[10px] text-amber-400/90 truncate block">{t.source || t.sourceCode}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-[9px] text-slate-400 block font-sans">DURATION</span>
                                  <span className="text-slate-200 font-semibold text-[11px]">{t.duration}</span>
                                  <span className="text-[9px] text-slate-400 font-sans">{t.stops} stops</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-slate-400 block font-sans">TO</span>
                                  <span className="text-emerald-400 font-bold text-xs">{t.arrival}</span>
                                  <span className="text-[10px] text-emerald-400/90 truncate block">{t.destination || t.destinationCode}</span>
                                </div>
                              </div>

                              {/* Available Classes */}
                              {t.classes && t.classes.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap my-2">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">Classes:</span>
                                  {t.classes.slice(0, 4).map((c: string, ci: number) => (
                                    <span
                                      key={ci}
                                      className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60 text-[10px]"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* AI Explanation */}
                              {t.explanation && (
                                <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed mb-3">
                                  {t.explanation}
                                </div>
                              )}

                              {/* Action Buttons: [VIEW DETAILS] & [BOOK NOW] */}
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                                {onViewTrainDetails && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const target = t.rawTrain || t;
                                      setContextReferencedTrain(target);
                                      onViewTrainDetails(target);
                                      onClose();
                                    }}
                                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700 hover:text-white cursor-pointer"
                                  >
                                    <span>VIEW DETAILS</span>
                                  </button>
                                )}
                                {onBookTrain && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const target = t.rawTrain || t;
                                      setContextReferencedTrain(target);
                                      onBookTrain(target);
                                      onClose();
                                    }}
                                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/20 cursor-pointer"
                                  >
                                    <Ticket className="w-3.5 h-3.5" />
                                    <span>BOOK NOW</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 1. Train Cards List */}
                    {msg.cards.type === 'TRAINS_LIST' && msg.cards.trains && (
                      <div className="space-y-2">
                        {msg.cards.trains.map((t, idx) => {
                          const minFare = t.min_fare || t.base_fare || 180;
                          const totalFare = t.total_fare || minFare * (msg.cards?.passengerCount || 1);
                          return (
                            <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 shadow text-slate-200 text-xs">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                                    #{t.train_number}
                                  </span>
                                  <span className="font-bold text-white text-xs truncate max-w-[180px]">
                                    {t.train_name}
                                  </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {t.train_type}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 my-2 py-1.5 border-y border-slate-800/80 text-[11px] font-mono">
                                <div>
                                  <span className="text-slate-500 text-[9px] block">DEP</span>
                                  <span className="text-white font-bold">{t.departure_time || t.source_time || '10:00'}</span>
                                  <span className="text-[9px] text-slate-400 block truncate">{t.boarding_stop?.station_code || 'DEP'}</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-slate-500 text-[9px] block">DURATION</span>
                                  <span className="text-amber-400 font-bold">{t.journey_duration}</span>
                                  <span className="text-[9px] text-slate-400 block">{t.stops_count || 3} stops</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-500 text-[9px] block">ARR</span>
                                  <span className="text-emerald-400 font-bold">{t.arrival_time || t.dest_time || '18:00'}</span>
                                  <span className="text-[9px] text-slate-400 block truncate">{t.destination_stop?.station_code || 'ARR'}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] mb-2.5">
                                <span className="text-slate-400">
                                  Est. Fare: <strong className="text-amber-400">₹{totalFare}</strong>
                                  {msg.cards?.passengerCount && msg.cards.passengerCount > 1 ? ` (${msg.cards.passengerCount} pax)` : ' / pax'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  {t.live_status?.status || 'On Time'}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800">
                                {onBookTrain && (
                                  <button
                                    onClick={() => {
                                      onBookTrain(t);
                                      onClose();
                                    }}
                                    className="py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 transition"
                                  >
                                    <span>Book Train</span>
                                  </button>
                                )}
                                {onViewTrainDetails && (
                                  <button
                                    onClick={() => {
                                      onViewTrainDetails(t);
                                      onClose();
                                    }}
                                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[10px] flex items-center justify-center gap-1 transition border border-slate-700"
                                  >
                                    <span>Details</span>
                                  </button>
                                )}
                                {onTrackTrain && (
                                  <button
                                    onClick={() => {
                                      onTrackTrain(t);
                                      onClose();
                                    }}
                                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium text-[10px] flex items-center justify-center gap-1 transition border border-slate-700"
                                  >
                                    <Navigation className="w-3 h-3 text-amber-400" />
                                    <span>Live Map</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. Hotel & Apartment Results */}
                    {msg.cards.type === 'HOTELS_LIST' && msg.cards.hotels && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.cards.hotels.map((h, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <h5 className="font-bold text-white text-xs truncate max-w-[150px]">
                                {h.property_name}
                              </h5>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                                {h.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mb-1.5">
                              {h.distance_display || `${h.distance_meters}m from station`}
                            </p>
                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800">
                              <span className="font-bold text-amber-400">₹{h.approximate_price_inr} / night</span>
                              <span className="text-amber-300 flex items-center gap-0.5 text-[10px]">
                                ★ {h.rating || 4.5}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. Ticket Card */}
                    {msg.cards.type === 'TICKET_BRIEF' && msg.cards.ticket && (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">PNR NUMBER</span>
                            <span className="font-mono font-bold text-amber-400 text-sm">{msg.cards.ticket.pnr}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {msg.cards.ticket.booking_status || 'CONFIRMED'}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-300">
                          <div>Train: <strong className="text-white">#{msg.cards.ticket.train_number} {msg.cards.ticket.train_name}</strong></div>
                          <div>Route: {msg.cards.ticket.boarding_station} ➔ {msg.cards.ticket.destination_station}</div>
                          <div>Date: <strong className="text-amber-400 font-mono">{msg.cards.ticket.journey_date}</strong> • Coach: {msg.cards.ticket.coach} ({msg.cards.ticket.seat_berth})</div>
                          <div>Total Fare: <strong className="text-emerald-400 font-mono">₹{msg.cards.ticket.total_fare || msg.cards.ticket.fare}</strong></div>
                        </div>

                        {onViewTicket && (
                          <div className="mt-3 pt-2 border-t border-slate-800 flex gap-2">
                            <button
                              onClick={() => {
                                onViewTicket(msg.cards!.ticket!);
                                onClose();
                              }}
                              className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1 transition"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>View Full Ticket & Track</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Comparison Table */}
                    {msg.cards.type === 'TRAIN_COMPARISON' && msg.cards.comparison && (
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-2">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                              <th className="py-1 px-2">Feature</th>
                              <th className="py-1 px-2 text-amber-400">Train 1</th>
                              <th className="py-1 px-2 text-blue-400">Train 2</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {msg.cards.comparison.table.map((row, idx) => (
                              <tr key={idx}>
                                <td className="py-1 px-2 font-medium text-slate-400">{row.feature}</td>
                                <td className="py-1 px-2 font-bold text-white">{row.train1}</td>
                                <td className="py-1 px-2 font-bold text-white">{row.train2}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 5. Intermediate Stops List */}
                    {msg.cards.type === 'STOPS_LIST' && msg.cards.stops && (
                      <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] custom-scrollbar">
                        {msg.cards.stops.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-800/60">
                            <span className="font-bold text-white">
                              {idx + 1}. {s.station_name}
                            </span>
                            <span className="font-mono text-slate-400 text-[10px]">
                              [{s.station_code}] • {s.distance_km} km
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`mt-2 text-[9px] text-right font-mono ${
                    msg.sender === 'user' ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>

                {/* Quick Action Suggestion Chips */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                    {msg.quickActions.map((action, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(action)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 hover:border-amber-500/40 transition cursor-pointer font-medium"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs pl-9 py-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Analyzing railway timetables, fares & live corridor status...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-3 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Type any train query, comparison, hotel question, or fare request..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-amber-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
