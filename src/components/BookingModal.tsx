import React, { useState } from 'react';
import {
  X,
  Ticket,
  ShieldCheck,
  CreditCard,
  Clock,
  User,
  Users,
  AlertCircle,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SearchResultTrain, Passenger, CalculatedClass, Booking, BookedPassenger, ConnectingTrainRoute } from '../types';

interface BookingModalProps {
  train: SearchResultTrain;
  connectingRoute?: ConnectingTrainRoute | null;
  passenger?: Passenger | null;
  passengers?: Passenger[] | null;
  journeyDate: string;
  onClose: () => void;
  onBookingConfirmed: (booking: Booking, backendNotifications?: any[]) => void;
  onUpdatePassengers?: (passengers: Passenger[]) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  train,
  connectingRoute,
  passenger,
  passengers,
  journeyDate,
  onClose,
  onBookingConfirmed,
  onUpdatePassengers,
}) => {
  // Resolve initial list of passengers (show only entered details, no dummy defaults)
  const defaultPassenger: Passenger = {
    user_id: 1,
    name: passenger?.name || '',
    age: passenger?.age || ('' as any),
    gender: passenger?.gender || 'Male',
    berth_preference: passenger?.berth_preference || 'Lower',
    aadhaar_number: passenger?.aadhaar_number || '',
    masked_aadhaar: passenger?.masked_aadhaar || (passenger?.aadhaar_number ? `XXXX-XXXX-${passenger.aadhaar_number.slice(-4)}` : ''),
    phone_number: passenger?.phone_number || '',
    email: passenger?.email || '',
  };

  const initialList: Passenger[] = (passengers && passengers.length > 0)
    ? passengers.map((p, idx) => ({
        ...p,
        user_id: p.user_id || idx + 1,
        name: p.name || '',
        age: p.age || ('' as any),
        gender: p.gender || 'Male',
        berth_preference: p.berth_preference || 'No Preference',
        aadhaar_number: p.aadhaar_number || '',
        masked_aadhaar: p.masked_aadhaar || (p.aadhaar_number ? `XXXX-XXXX-${p.aadhaar_number.slice(-4)}` : ''),
        phone_number: p.phone_number || '',
        email: p.email || '',
      }))
    : (passenger ? [{
        ...passenger,
        name: passenger.name || '',
        age: passenger.age || ('' as any),
        gender: passenger.gender || 'Male',
        berth_preference: passenger.berth_preference || 'Lower',
        masked_aadhaar: passenger.masked_aadhaar || (passenger.aadhaar_number ? `XXXX-XXXX-${passenger.aadhaar_number.slice(-4)}` : ''),
        phone_number: passenger.phone_number || '',
        email: passenger.email || '',
      }] : [defaultPassenger]);

  // Interactive passenger state inside BookingModal
  const [travelers, setTravelers] = useState<Passenger[]>(initialList);
  const [isEditingTravelers, setIsEditingTravelers] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Default to first available class for direct train
  const [selectedClass, setSelectedClass] = useState<CalculatedClass>(
    train.calculated_classes[0] || {
      class_name: 'Second Class',
      base_fare: 150,
      fare_per_km: 0.3,
      fare: 150,
      available_seats: 50,
    }
  );

  // Independent class selection for Leg 1 and Leg 2 for connecting trains
  const leg1AvailableClasses = connectingRoute?.leg1.calculated_classes || train.calculated_classes;
  const leg2AvailableClasses = connectingRoute?.leg2.calculated_classes || train.calculated_classes;

  const [leg1SelectedClass, setLeg1SelectedClass] = useState<CalculatedClass>(
    leg1AvailableClasses[0] || selectedClass
  );
  const [leg2SelectedClass, setLeg2SelectedClass] = useState<CalculatedClass>(
    leg2AvailableClasses[0] || selectedClass
  );

  // Live indicator banner for demo ticket update
  const [demoTicketNotice, setDemoTicketNotice] = useState<string>('Live demo ticket synchronized with default class');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const passengerCount = travelers.length;
  const primaryPassenger = travelers[0] || defaultPassenger;

  // Complete fare calculations for either direct or connected trains with independent classes
  const leg1Fare = connectingRoute ? (leg1SelectedClass?.fare || connectingRoute.leg1.base_fare || 250) : 0;
  const leg2Fare = connectingRoute ? (leg2SelectedClass?.fare || connectingRoute.leg2.base_fare || 250) : 0;
  const combinedPerPersonFare = connectingRoute
    ? (leg1Fare + leg2Fare)
    : selectedClass.fare;

  const perPersonFare = combinedPerPersonFare;
  const baseFarePerPerson = connectingRoute
    ? Math.floor(perPersonFare * 0.4)
    : (selectedClass.base_fare ?? Math.floor(perPersonFare * 0.4));
  const distanceFarePerPerson = Math.max(0, perPersonFare - baseFarePerPerson);
  const totalBaseFare = baseFarePerPerson * passengerCount;
  const totalDistanceFare = distanceFarePerPerson * passengerCount;
  const totalFare = perPersonFare * passengerCount;

  // Coach calculation based on chosen class
  const getCoachName = (className: string, legNum: 1 | 2 = 1) => {
    if (className.includes('Sleeper') || className.includes('SL')) return legNum === 1 ? 'S2' : 'S4';
    if (className.includes('AC Compartment') || className.includes('3A') || className.includes('Tier')) return legNum === 1 ? 'B1' : 'B2';
    if (className.includes('Executive') || className.includes('EC')) return legNum === 1 ? 'EC1' : 'EC2';
    if (className.includes('Chair') || className.includes('CC')) return legNum === 1 ? 'C1' : 'C2';
    return legNum === 1 ? 'GS1' : 'GS2';
  };

  // Helper to mask Aadhaar (never produces fallback dummy strings)
  const maskAadhaar = (num: string) => {
    if (!num) return '';
    const clean = String(num).replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length < 4) return `XXXX-XXXX-${clean}`;
    const last4 = clean.slice(-4);
    return `XXXX-XXXX-${last4}`;
  };

  // Update a field for a specific traveler
  const handleUpdateTraveler = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...travelers];
    const target = { ...updated[index] };

    if (field === 'aadhaar_number') {
      const clean = String(value).replace(/\D/g, '').slice(0, 12);
      target.aadhaar_number = clean;
      target.masked_aadhaar = maskAadhaar(clean);
    } else if (field === 'age') {
      const num = parseInt(value, 10);
      target.age = isNaN(num) ? '' as any : Math.min(120, Math.max(1, num));
    } else {
      (target as any)[field] = value;
    }

    updated[index] = target;
    setTravelers(updated);
    if (onUpdatePassengers) onUpdatePassengers(updated);
  };

  // Add another person (up to 6) without assembling fake names or numbers
  const handleAddTraveler = () => {
    if (travelers.length >= 6) {
      setError('A maximum of 6 persons can be booked per ticket.');
      return;
    }
    setError('');
    const nextIdx = travelers.length + 1;

    const newPerson: Passenger = {
      user_id: nextIdx,
      passenger_id: nextIdx,
      name: '',
      age: '' as any,
      gender: 'Male',
      berth_preference: 'No Preference',
      aadhaar_number: '',
      masked_aadhaar: '',
      phone_number: primaryPassenger.phone_number || '',
      email: primaryPassenger.email || '',
    };

    const updated = [...travelers, newPerson];
    setTravelers(updated);
    setEditingIndex(updated.length - 1);
    setIsEditingTravelers(true);
    if (onUpdatePassengers) onUpdatePassengers(updated);
  };

  // Remove a person (minimum 1)
  const handleRemoveTraveler = (index: number) => {
    if (travelers.length <= 1) {
      setError('At least one traveler is required to complete reservation.');
      return;
    }
    setError('');
    const updated = travelers.filter((_, i) => i !== index);
    setTravelers(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    if (onUpdatePassengers) onUpdatePassengers(updated);
  };

  // Final booking confirmation
  const handleConfirm = async () => {
    // Validate traveler names and ages
    for (let i = 0; i < travelers.length; i++) {
      const p = travelers[i];
      if (!p.name || p.name.trim().length === 0) {
        setError(`Please enter a valid name for Person #${i + 1}.`);
        setIsEditingTravelers(true);
        setEditingIndex(i);
        return;
      }
      if (!p.age || Number(p.age) < 1) {
        setError(`Please enter a valid age for ${p.name || `Person #${i + 1}`}.`);
        setIsEditingTravelers(true);
        setEditingIndex(i);
        return;
      }
    }

    setIsProcessing(true);
    setError('');

    try {
      const pnrNumber = `TI${Math.floor(10000000 + Math.random() * 90000000)}`;

      let coach = 'S2';
      if (selectedClass.class_name.includes('AC Compartment') || selectedClass.class_name.includes('AC 3-Tier')) coach = 'B1';
      else if (selectedClass.class_name.includes('Executive')) coach = 'EC1';
      else if (selectedClass.class_name.includes('Chair Car')) coach = 'C1';
      else if (selectedClass.class_name.includes('Second')) coach = 'GS';

      const startSeatNum = Math.floor(1 + Math.random() * 50);

      const bookedPassengers: BookedPassenger[] = travelers.map((p, idx) => {
        const seat = startSeatNum + idx;
        const berthPref = p.berth_preference && p.berth_preference !== 'No Preference'
          ? p.berth_preference
          : (idx % 2 === 0 ? 'Lower' : 'Middle');
        const cleanAadhaar = p.aadhaar_number ? String(p.aadhaar_number).replace(/\D/g, '') : '';
        const displayAadhaar = cleanAadhaar ? maskAadhaar(cleanAadhaar) : (p.masked_aadhaar || '');
        return {
          passenger_id: p.passenger_id || idx + 1,
          name: p.name.trim(),
          age: Number(p.age) || undefined,
          gender: p.gender || 'Male',
          masked_aadhaar: displayAadhaar,
          berth_preference: p.berth_preference || 'No Preference',
          coach: coach,
          berth_number: `${seat}`,
          seat_berth: `${seat} (${berthPref})`,
          status: 'CONFIRMED',
          phone_number: p.phone_number || primaryPassenger.phone_number || '',
          email: p.email || primaryPassenger.email || '',
        };
      });

      const bookingPayload = {
        passenger: primaryPassenger,
        passengers: bookedPassengers,
        passenger_name: primaryPassenger.name,
        masked_aadhaar: primaryPassenger.masked_aadhaar || (primaryPassenger.aadhaar_number ? maskAadhaar(primaryPassenger.aadhaar_number) : ''),
        phone_number: primaryPassenger.phone_number || '',
        email: primaryPassenger.email || '',
        passenger_count: passengerCount,
        train_id: train.train_id,
        train_number: connectingRoute ? `${connectingRoute.leg1.train_number} ➔ ${connectingRoute.leg2.train_number}` : train.train_number,
        train_name: connectingRoute ? `${connectingRoute.leg1.train_name} + ${connectingRoute.leg2.train_name}` : train.train_name,
        train_type: connectingRoute ? `${connectingRoute.leg1.train_type} / ${connectingRoute.leg2.train_type}` : train.train_type,
        source: connectingRoute ? connectingRoute.leg1.boarding_stop.station_name : train.source,
        destination: connectingRoute ? connectingRoute.leg2.destination_stop.station_name : train.destination,
        boarding_station: connectingRoute ? connectingRoute.leg1.boarding_stop.station_name : train.boarding_stop.station_name,
        boarding_station_code: connectingRoute ? connectingRoute.leg1.boarding_stop.station_code : train.boarding_stop.station_code,
        destination_station: connectingRoute ? connectingRoute.leg2.destination_stop.station_name : train.destination_stop.station_name,
        destination_station_code: connectingRoute ? connectingRoute.leg2.destination_stop.station_code : train.destination_stop.station_code,
        journey_date: journeyDate,
        departure_time: connectingRoute ? connectingRoute.leg1.departure_time : train.departure_time,
        arrival_time: connectingRoute ? connectingRoute.leg2.arrival_time : train.arrival_time,
        journey_duration: connectingRoute ? connectingRoute.total_duration : train.journey_duration,
        travel_class: connectingRoute
          ? (leg1SelectedClass.class_name !== leg2SelectedClass.class_name
              ? `${leg1SelectedClass.class_name} (Leg 1) + ${leg2SelectedClass.class_name} (Leg 2)`
              : leg1SelectedClass.class_name)
          : selectedClass.class_name,
        per_passenger_fare: perPersonFare,
        fare: totalFare,
        total_fare: totalFare,
        coach: connectingRoute ? getCoachName(leg1SelectedClass.class_name, 1) : coach,
        seat_berth: bookedPassengers[0]?.seat_berth || `${startSeatNum} (Lower)`,
        is_connecting_journey: !!connectingRoute,
        junction_station_code: connectingRoute?.junction_station_code,
        junction_station_name: connectingRoute?.junction_station_name,
        layover_duration: connectingRoute?.layover_duration,
        leg1_booking: connectingRoute ? {
          train_number: connectingRoute.leg1.train_number,
          train_name: connectingRoute.leg1.train_name,
          travel_class: leg1SelectedClass.class_name,
          coach: getCoachName(leg1SelectedClass.class_name, 1),
          seat_berth: `${startSeatNum} (Lower)`,
          departure_time: connectingRoute.leg1.departure_time,
          arrival_time: connectingRoute.leg1.arrival_time,
          fare: leg1Fare * passengerCount,
          platform: connectingRoute.leg1.boarding_stop.platform_number || 2,
        } : undefined,
        leg2_booking: connectingRoute ? {
          train_number: connectingRoute.leg2.train_number,
          train_name: connectingRoute.leg2.train_name,
          travel_class: leg2SelectedClass.class_name,
          coach: getCoachName(leg2SelectedClass.class_name, 2),
          seat_berth: `${startSeatNum + 2} (Upper)`,
          departure_time: connectingRoute.leg2.departure_time,
          arrival_time: connectingRoute.leg2.arrival_time,
          fare: leg2Fare * passengerCount,
          platform: 1,
        } : undefined,
        connecting_route_data: connectingRoute || undefined,
      };

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.booking) {
          onBookingConfirmed(data.booking, data.notifications || (data.notification ? [data.notification] : undefined));
          return;
        }
      }

      // Fallback local booking
      const fallbackBooking: Booking = {
        booking_id: Date.now(),
        pnr: pnrNumber,
        booking_status: 'CONFIRMED',
        booked_at: new Date().toISOString(),
        ...bookingPayload,
        passengers: bookedPassengers,
        passenger_count: passengerCount,
      };
      onBookingConfirmed(fallbackBooking);
    } catch {
      const pnrNumber = `TI${Math.floor(10000000 + Math.random() * 90000000)}`;
      let coach = 'S2';
      if (selectedClass.class_name.includes('AC')) coach = 'B1';
      else if (selectedClass.class_name.includes('Executive')) coach = 'EC1';
      else if (selectedClass.class_name.includes('Chair')) coach = 'C1';

      const startSeatNum = Math.floor(1 + Math.random() * 50);
      const bookedPassengers: BookedPassenger[] = travelers.map((p, idx) => {
        const cleanAadhaar = p.aadhaar_number ? String(p.aadhaar_number).replace(/\D/g, '') : '';
        const displayAadhaar = cleanAadhaar ? maskAadhaar(cleanAadhaar) : (p.masked_aadhaar || '');
        return {
          passenger_id: p.passenger_id || idx + 1,
          name: p.name,
          age: Number(p.age) || undefined,
          gender: p.gender || 'Male',
          masked_aadhaar: displayAadhaar,
          berth_preference: p.berth_preference || 'No Preference',
          coach: coach,
          berth_number: `${startSeatNum + idx}`,
          seat_berth: `${startSeatNum + idx} (${p.berth_preference || 'Lower'})`,
          status: 'CONFIRMED',
          phone_number: p.phone_number || primaryPassenger.phone_number || '',
          email: p.email || primaryPassenger.email || '',
        };
      });

      const fallbackBooking: Booking = {
        booking_id: Date.now(),
        pnr: pnrNumber,
        booking_status: 'CONFIRMED',
        booked_at: new Date().toISOString(),
        passenger: primaryPassenger,
        passengers: bookedPassengers,
        passenger_name: primaryPassenger.name,
        masked_aadhaar: primaryPassenger.masked_aadhaar || (primaryPassenger.aadhaar_number ? maskAadhaar(primaryPassenger.aadhaar_number) : ''),
        phone_number: primaryPassenger.phone_number || '',
        email: primaryPassenger.email || '',
        passenger_count: passengerCount,
        train_id: train.train_id,
        train_number: connectingRoute ? `${connectingRoute.leg1.train_number} ➔ ${connectingRoute.leg2.train_number}` : train.train_number,
        train_name: connectingRoute ? `${connectingRoute.leg1.train_name} + ${connectingRoute.leg2.train_name}` : train.train_name,
        train_type: connectingRoute ? `${connectingRoute.leg1.train_type} / ${connectingRoute.leg2.train_type}` : train.train_type,
        source: connectingRoute ? connectingRoute.leg1.boarding_stop.station_name : train.source,
        destination: connectingRoute ? connectingRoute.leg2.destination_stop.station_name : train.destination,
        boarding_station: connectingRoute ? connectingRoute.leg1.boarding_stop.station_name : train.boarding_stop.station_name,
        boarding_station_code: connectingRoute ? connectingRoute.leg1.boarding_stop.station_code : train.boarding_stop.station_code,
        destination_station: connectingRoute ? connectingRoute.leg2.destination_stop.station_name : train.destination_stop.station_name,
        destination_station_code: connectingRoute ? connectingRoute.leg2.destination_stop.station_code : train.destination_stop.station_code,
        journey_date: journeyDate,
        departure_time: connectingRoute ? connectingRoute.leg1.departure_time : train.departure_time,
        arrival_time: connectingRoute ? connectingRoute.leg2.arrival_time : train.arrival_time,
        journey_duration: connectingRoute ? connectingRoute.total_duration : train.journey_duration,
        travel_class: selectedClass.class_name,
        per_passenger_fare: perPersonFare,
        fare: totalFare,
        total_fare: totalFare,
        coach: coach,
        seat_berth: bookedPassengers[0]?.seat_berth || `${startSeatNum} (Lower)`,
        is_connecting_journey: !!connectingRoute,
        junction_station_code: connectingRoute?.junction_station_code,
        junction_station_name: connectingRoute?.junction_station_name,
        layover_duration: connectingRoute?.layover_duration,
        leg1_booking: connectingRoute ? {
          train_number: connectingRoute.leg1.train_number,
          train_name: connectingRoute.leg1.train_name,
          coach: coach,
          seat_berth: `${startSeatNum} (Lower)`,
          departure_time: connectingRoute.leg1.departure_time,
          arrival_time: connectingRoute.leg1.arrival_time,
          fare: leg1Fare * passengerCount,
          platform: connectingRoute.leg1.boarding_stop.platform_number || 2,
        } : undefined,
        leg2_booking: connectingRoute ? {
          train_number: connectingRoute.leg2.train_number,
          train_name: connectingRoute.leg2.train_name,
          coach: coach.includes('B') ? 'B2' : 'S3',
          seat_berth: `${startSeatNum + 2} (Upper)`,
          departure_time: connectingRoute.leg2.departure_time,
          arrival_time: connectingRoute.leg2.arrival_time,
          fare: leg2Fare * passengerCount,
          platform: 1,
        } : undefined,
      };
      onBookingConfirmed(fallbackBooking);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-5 sm:p-7 text-white shadow-2xl relative my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  {connectingRoute ? 'Connecting Journey Reservation' : 'Ticket Reservation'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {passengerCount} {passengerCount === 1 ? 'Person' : 'Persons'}
                </span>
                {connectingRoute && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    2 Trains Combined
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {connectingRoute
                  ? `Transfer at ${connectingRoute.junction_station_name} (${connectingRoute.junction_station_code}) • Buffer: ${connectingRoute.layover_duration}`
                  : `${train.train_name} • #${train.train_number} (${train.train_type})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* PROMINENT HORIZONTAL CURRENT DEPARTURE & ROUTE TIMELINE */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Departure (Left) */}
              <div className="flex-1 min-w-[170px]">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Current Departure</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {train.departure_time}
                </div>
                <div className="text-sm font-bold text-amber-300 truncate">
                  {train.boarding_stop.station_name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  <span className="text-slate-300 font-bold">{train.boarding_stop.station_code}</span> • Platform 2 • {journeyDate}
                </div>
              </div>

              {/* Rail Corridor Track (Center) */}
              <div className="flex-1 flex flex-col items-center justify-center px-2 py-1 border-y sm:border-y-0 sm:border-x border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <span>{train.journey_duration}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-amber-400">{train.journey_distance_km} km</span>
                </div>
                <div className="w-full flex items-center my-1.5 relative max-w-[200px]">
                  <div className="h-0.5 w-full bg-slate-800" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-amber-400 flex items-center gap-1 shadow-sm">
                      <span className="animate-pulse">🚆</span>
                      <span className="text-[9px] font-bold text-emerald-400">On Time</span>
                    </span>
                  </div>
                  <div className="h-0.5 w-full bg-slate-800" />
                </div>
                <span className="text-[10px] text-slate-500">
                  {train.stops_between_count === 0 ? 'Direct Non-stop' : `${train.stops_between_count} Halts on Route`}
                </span>
              </div>

              {/* Arrival (Right) */}
              <div className="flex-1 min-w-[170px] text-left sm:text-right">
                <div className="flex items-center sm:justify-end gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                  <span>Destination Arrival</span>
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {train.arrival_time}
                </div>
                <div className="text-sm font-bold text-emerald-300 truncate">
                  {train.destination_stop.station_name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  <span className="text-slate-300 font-bold">{train.destination_stop.station_code}</span> • Platform 1
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Travel Class Selection */}
          {/* Section 1: Travel Class Selection (Supports Different Classes for Leg 1 and Leg 2) */}
          <div className="space-y-4">
            {connectingRoute ? (
              <>
                {/* Leg 1 Class Selector */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-mono font-bold flex items-center justify-center">
                        1A
                      </span>
                      <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                        Select Leg 1 Class: #{connectingRoute.leg1.train_number} {connectingRoute.leg1.train_name}
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {connectingRoute.leg1.boarding_stop.station_code} ➔ {connectingRoute.junction_station_code} ({connectingRoute.leg1.train_type})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {leg1AvailableClasses.map((cls, idx) => {
                      const isSelected = leg1SelectedClass.class_name === cls.class_name;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setLeg1SelectedClass(cls);
                            setDemoTicketNotice(`✨ Demo Ticket Updated: Leg 1 changed to ${cls.class_name} (Coach ${getCoachName(cls.class_name, 1)} • ₹${cls.fare})`);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50 shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs">{cls.class_name}</span>
                            {isSelected ? (
                              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                            )}
                          </div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-[10px] text-emerald-400 font-medium">
                              {cls.available_seats} seats
                            </span>
                            <span className="text-sm font-black font-mono text-amber-400">
                              ₹{cls.fare}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Leg 2 Class Selector */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
                        1B
                      </span>
                      <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                        Select Leg 2 Class: #{connectingRoute.leg2.train_number} {connectingRoute.leg2.train_name}
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {connectingRoute.junction_station_code} ➔ {connectingRoute.leg2.destination_stop.station_code} ({connectingRoute.leg2.train_type})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {leg2AvailableClasses.map((cls, idx) => {
                      const isSelected = leg2SelectedClass.class_name === cls.class_name;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setLeg2SelectedClass(cls);
                            setDemoTicketNotice(`✨ Demo Ticket Updated: Leg 2 changed to ${cls.class_name} (Coach ${getCoachName(cls.class_name, 2)} • ₹${cls.fare})`);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500/50 shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs">{cls.class_name}</span>
                            {isSelected ? (
                              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                            )}
                          </div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-[10px] text-emerald-400 font-medium">
                              {cls.available_seats} seats
                            </span>
                            <span className="text-sm font-black font-mono text-emerald-400">
                              ₹{cls.fare}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    1. Select Travel Class
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {train.calculated_classes.length} classes available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {train.calculated_classes.map((cls, idx) => {
                    const isSelected = selectedClass.class_name === cls.class_name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedClass(cls);
                          setDemoTicketNotice(`✨ Demo Ticket Updated: Class set to ${cls.class_name} (₹${cls.fare})`);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50 shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm">{cls.class_name}</span>
                          {isSelected ? (
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-700" />
                          )}
                        </div>

                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-xs text-emerald-400 font-medium">
                            {cls.available_seats} Seats Available
                          </span>
                          <div className="text-right">
                            <span className="text-base font-black font-mono text-amber-400">
                              ₹{cls.fare}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-normal">/ person</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LIVE DYNAMIC DEMO TICKET PREVIEW CARD (Updates instantly when class is chosen) */}
            <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Interactive Live Demo Ticket Preview
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Reactive
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  PNR: TI{train.train_number}DEMO
                </span>
              </div>

              {/* Dynamic Update Notification Banner */}
              <div className="mt-2.5 py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold">{demoTicketNotice}</span>
              </div>

              {/* Ticket Segments Body */}
              <div className="mt-3 space-y-2.5 text-xs">
                {connectingRoute ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Leg 1 Preview Segment */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-amber-400 uppercase">Leg 1 Segment</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {leg1SelectedClass.class_name}
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs truncate">
                        #{connectingRoute.leg1.train_number} {connectingRoute.leg1.train_name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono pt-1">
                        <span>Coach: <strong className="text-amber-400 font-bold">{getCoachName(leg1SelectedClass.class_name, 1)}</strong></span>
                        <span>Berth: <strong className="text-emerald-400">42 (Lower)</strong></span>
                        <span>Fare: <strong className="text-white">₹{leg1Fare}</strong></span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        Dep {connectingRoute.leg1.boarding_stop.station_code} ({connectingRoute.leg1.departure_time}) ➔ Arr {connectingRoute.junction_station_code} ({connectingRoute.leg1.arrival_time})
                      </div>
                    </div>

                    {/* Leg 2 Preview Segment */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-emerald-400 uppercase">Leg 2 Segment</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          {leg2SelectedClass.class_name}
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs truncate">
                        #{connectingRoute.leg2.train_number} {connectingRoute.leg2.train_name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono pt-1">
                        <span>Coach: <strong className="text-emerald-400 font-bold">{getCoachName(leg2SelectedClass.class_name, 2)}</strong></span>
                        <span>Berth: <strong className="text-emerald-400">18 (Upper)</strong></span>
                        <span>Fare: <strong className="text-white">₹{leg2Fare}</strong></span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        Dep {connectingRoute.junction_station_code} ({connectingRoute.leg2.departure_time}) ➔ Arr {connectingRoute.leg2.destination_stop.station_code} ({connectingRoute.leg2.arrival_time})
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">#{train.train_number} {train.train_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {selectedClass.class_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {train.boarding_stop.station_name} ({train.departure_time}) ➔ {train.destination_stop.station_name} ({train.arrival_time})
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span>Coach: <strong className="text-amber-400">{getCoachName(selectedClass.class_name, 1)}</strong></span>
                      <span>Seat: <strong className="text-emerald-400">32 (Lower)</strong></span>
                      <span>Rate: <strong className="text-white">₹{selectedClass.fare}</strong></span>
                    </div>
                  </div>
                )}

                {/* Primary Passenger & Total in Demo Ticket */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="text-slate-300">
                    <span>Passenger: <strong className="text-white">{primaryPassenger.name || 'Primary Traveler'}</strong></span>
                    {primaryPassenger.masked_aadhaar && (
                      <span className="ml-2 font-mono text-amber-400">({primaryPassenger.masked_aadhaar})</span>
                    )}
                    <span className="ml-2 text-slate-400">• {passengerCount} Traveler(s)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Live Ticket Amount: </span>
                    <span className="text-base font-black font-mono text-amber-400">₹{totalFare}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Person Details Management */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  2. Person Details ({passengerCount} {passengerCount === 1 ? 'Traveler' : 'Travelers'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingTravelers(!isEditingTravelers)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingTravelers ? 'Done Editing' : 'Edit / Add Persons'}</span>
                  {isEditingTravelers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {travelers.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddTraveler}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-amber-500/30"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Person</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of Persons with Inline Form & Summaries */}
            <div className="space-y-2.5">
              {travelers.map((p, idx) => {
                const isEditing = isEditingTravelers || editingIndex === idx;

                return (
                  <div
                    key={p.passenger_id || idx}
                    className={`rounded-xl border transition p-3 ${
                      isEditing
                        ? 'bg-slate-900 border-amber-500/50 shadow-md'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Traveler Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                          P{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-white">
                          {p.name || `Person ${idx + 1}`}
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Primary
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => setEditingIndex(idx)}
                            className="text-slate-400 hover:text-amber-400 p-1 text-xs transition"
                            title="Edit this person"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {travelers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTraveler(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 text-xs transition"
                            title="Remove this person"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Person Summary (Collapsed View) */}
                    {!isEditing && (
                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                        <div>
                          {p.age ? <span>{p.age} yrs</span> : null}
                          {p.age && p.gender && <span className="mx-1.5 text-slate-600">•</span>}
                          <span>{p.gender}</span>
                          <span className="mx-1.5 text-slate-600">•</span>
                          <span>Berth: <strong className="text-slate-200">{p.berth_preference}</strong></span>
                        </div>
                        {p.masked_aadhaar && (
                          <div className="text-amber-400 font-semibold">
                            {p.masked_aadhaar}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Person Edit Inputs (Expanded View) */}
                    {isEditing && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                        {/* Name */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => handleUpdateTraveler(idx, 'name', e.target.value)}
                            placeholder="Enter passenger name"
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 text-xs"
                          />
                        </div>

                        {/* Age */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={p.age}
                            onChange={(e) => handleUpdateTraveler(idx, 'age', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                          />
                        </div>

                        {/* Gender */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Gender
                          </label>
                          <select
                            value={p.gender}
                            onChange={(e) => handleUpdateTraveler(idx, 'gender', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 text-xs"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Berth Preference */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Berth
                          </label>
                          <select
                            value={p.berth_preference}
                            onChange={(e) => handleUpdateTraveler(idx, 'berth_preference', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 text-xs"
                          >
                            <option value="No Preference">No Preference</option>
                            <option value="Lower">Lower Berth</option>
                            <option value="Middle">Middle Berth</option>
                            <option value="Upper">Upper Berth</option>
                            <option value="Side Lower">Side Lower</option>
                            <option value="Side Upper">Side Upper</option>
                            <option value="Window Seat">Window Seat</option>
                          </select>
                        </div>

                        {/* Aadhaar Number */}
                        <div className="sm:col-span-12 mt-1">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] uppercase font-bold text-slate-400">
                              Aadhaar Number (12 Digits)
                            </label>
                            {p.masked_aadhaar ? (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                                <ShieldCheck className="w-3 h-3" />
                                Masked: <strong className="font-mono text-amber-400">{p.masked_aadhaar}</strong>
                              </span>
                            ) : null}
                          </div>
                          <input
                            type="text"
                            maxLength={12}
                            value={p.aadhaar_number}
                            onChange={(e) => handleUpdateTraveler(idx, 'aadhaar_number', e.target.value)}
                            placeholder="12-digit Aadhaar number"
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 text-xs font-mono tracking-wider"
                          />
                        </div>

                        {/* Contact Details (Primary Passenger P1) */}
                        {idx === 0 && (
                          <div className="sm:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-800/80">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Mobile Number
                              </label>
                              <input
                                type="tel"
                                maxLength={10}
                                value={p.phone_number || ''}
                                onChange={(e) => handleUpdateTraveler(idx, 'phone_number', e.target.value.replace(/\D/g, ''))}
                                placeholder="10-digit mobile number"
                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Notification Email
                              </label>
                              <input
                                type="email"
                                value={p.email || ''}
                                onChange={(e) => handleUpdateTraveler(idx, 'email', e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Fare Breakdown Calculation */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Fare Breakdown Calculation
              </span>
              {connectingRoute && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Full Journey Ticket • 2 Trains Combined
                </span>
              )}
            </div>

            {connectingRoute && (
              <div className="mb-3 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Leg 1: {connectingRoute.leg1.train_name} (#{connectingRoute.leg1.train_number})</span>
                  <span className="font-mono text-amber-300">₹{leg1Fare} / person</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Leg 2: {connectingRoute.leg2.train_name} (#{connectingRoute.leg2.train_number})</span>
                  <span className="font-mono text-amber-300">₹{leg2Fare} / person</span>
                </div>
                <div className="flex justify-between text-blue-200 font-semibold pt-1 border-t border-blue-500/20">
                  <span>Combined Rate ({passengerCount} {passengerCount === 1 ? 'Person' : 'Persons'}):</span>
                  <span className="font-mono text-emerald-400">₹{perPersonFare * passengerCount}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Class Fare Rate ({connectingRoute ? `${leg1SelectedClass.class_name} (Leg 1) + ${leg2SelectedClass.class_name} (Leg 2)` : selectedClass.class_name}):</span>
                <span className="font-mono text-slate-200">₹{perPersonFare} / person</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Number of Persons:</span>
                <span className="font-mono font-bold text-amber-400">× {passengerCount} {passengerCount === 1 ? 'Traveler' : 'Travelers'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Combined Base & Distance Charges:</span>
                <span className="font-mono text-slate-200">₹{totalBaseFare + totalDistanceFare}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Reservation Fee:</span>
                <span className="font-mono text-emerald-400">₹0 (Waived Demo)</span>
              </div>
              <div className="pt-2.5 border-t border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-sm text-white block">Total Amount to Pay:</span>
                  <span className="text-[11px] text-slate-400">
                    {connectingRoute ? '(Complete Journey - Both Trains Total)' : `(₹${perPersonFare} × ${passengerCount} ${passengerCount === 1 ? 'Person' : 'Persons'})`}
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  ₹{totalFare}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Confirmation Action */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-sm font-black flex items-center space-x-2 shadow-xl shadow-amber-500/25 transition transform active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <span>{isProcessing ? 'Confirming Ticket...' : `Confirm Demo Booking • ₹${totalFare}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
