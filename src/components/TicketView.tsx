import React, { useState } from 'react';
import {
  Ticket,
  Printer,
  Navigation,
  ShieldAlert,
  Train,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Share2,
  BellRing,
  Ban,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Download,
  MapPin,
  GitFork
} from 'lucide-react';
import { Booking } from '../types';
import { CancelTicketModal } from './CancelTicketModal';
import { formatSegmentDate } from '../utils/dateUtils';

interface TicketViewProps {
  booking: Booking;
  onBookAnother: () => void;
  onTrackLive: () => void;
  onTriggerApproachingAlert?: () => void;
  onUpdateBooking?: (updatedBooking: Booking) => void;
  onOpenCopilot?: () => void;
}

export const TicketView: React.FC<TicketViewProps> = ({
  booking,
  onBookAnother,
  onTrackLive,
  onTriggerApproachingAlert,
  onUpdateBooking,
  onOpenCopilot,
}) => {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTicket = () => {
    const isConnecting = booking.is_connecting_journey;
    const passengerLines = (booking.passengers && booking.passengers.length > 0
      ? booking.passengers
      : [booking.passenger || { name: booking.passenger_name, seat_berth: booking.seat_berth }]
    ).map((p: any, i: number) => `   Passenger ${i + 1}: ${p.name || 'Passenger'} | Age/Gender: ${p.age || '—'} / ${p.gender || '—'} | Coach: ${p.coach || booking.coach} | Berth: ${p.seat_berth || booking.seat_berth || booking.berth_number}`).join('\n');

    const content = `
========================================================================
                      TRAININAPP E-TICKET CONFIRMATION
========================================================================
PNR NUMBER        : ${booking.pnr}
BOOKING STATUS    : ${booking.booking_status || 'CONFIRMED'}
BOOKING DATE      : ${new Date(booking.booked_at || Date.now()).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}

------------------------------------------------------------------------
JOURNEY SCHEDULE
------------------------------------------------------------------------
TRAIN             : #${booking.train_number} - ${booking.train_name} (${booking.train_type || 'Superfast'})
BOARDING STATION  : ${booking.boarding_station} (${booking.boarding_station_code || 'SRR'})
DEPARTURE TIME    : ${booking.departure_time}
DESTINATION       : ${booking.destination_station} (${booking.destination_station_code || 'TPJ'})
ARRIVAL TIME      : ${booking.arrival_time}
JOURNEY DATE      : ${booking.journey_date}
DURATION          : ${booking.journey_duration}
CLASS             : ${booking.travel_class}
TOTAL PASSENGERS  : ${booking.passenger_count || (booking.passengers?.length || 1)}
TOTAL FARE        : ₹${booking.total_fare || booking.fare} (Paid)
${isConnecting ? `
------------------------------------------------------------------------
CONNECTING ITINERARY DETAILS
------------------------------------------------------------------------
Transfer Junction : ${booking.junction_station_name || booking.junction_station_code}
Layover Duration  : ${booking.layover_duration || '1h 30m'}
Leg 1 Train       : #${booking.leg1_booking?.train_number || 'Train 1'} (${booking.boarding_station_code} -> ${booking.junction_station_code}) Dep: ${booking.leg1_booking?.departure_time} | Coach: ${booking.leg1_booking?.coach} | Seat: ${booking.leg1_booking?.seat_berth}
Leg 2 Train       : #${booking.leg2_booking?.train_number || 'Train 2'} (${booking.junction_station_code} -> ${booking.destination_station_code}) Dep: ${booking.leg2_booking?.departure_time} | Coach: ${booking.leg2_booking?.coach} | Seat: ${booking.leg2_booking?.seat_berth}
` : ''}
------------------------------------------------------------------------
PASSENGER & BERTH ALLOTMENT
------------------------------------------------------------------------
${passengerLines}

------------------------------------------------------------------------
IMPORTANT INSTRUCTIONS
------------------------------------------------------------------------
1. This is a computer generated confirmation issued by TrainInApp.
2. Please carry valid Government Photo ID proof (Aadhaar / Voter ID / Passport) during travel.
3. Arrive at the platform 15-20 minutes before scheduled departure.
4. Track your live vertical train location inside the TrainInApp portal.

========================================================================
            THANK YOU FOR CHOOSING TRAININAPP RAILWAY ASSISTANT
========================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TrainInApp_Ticket_${booking.pnr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isCancelled = booking.booking_status === 'CANCELLED';

  const formattedJourneyDate = formatSegmentDate(booking.journey_date, 0, true);
  const formattedBoardingDate = formatSegmentDate(booking.journey_date, 0, true);
  const formattedArrivalDate = formatSegmentDate(
    booking.journey_date,
    booking.journey_duration?.includes('d') || (booking.arrival_time < booking.departure_time) ? 1 : 0,
    true
  );
  const formattedLeg2Date = formatSegmentDate(
    booking.journey_date,
    (booking.leg1_booking?.arrival_time && booking.leg2_booking?.departure_time && booking.leg2_booking.departure_time < booking.leg1_booking.arrival_time) ? 1 : 0,
    true
  );
  const passengerCount = booking.passengers && booking.passengers.length > 0
    ? booking.passengers.length
    : (booking.passenger_count || 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Status Banner */}
      <div className="text-center mb-6 no-print">
        {isCancelled ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/10">
              <Ban className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ticket Cancelled
            </h1>
            <p className="text-xs text-rose-300 mt-1">
              {booking.refund_details?.refund_denied
                ? 'Ticket has been cancelled. Return amount was voluntarily denied by passenger.'
                : `Ticket has been cancelled. Partial refund of ₹${booking.refund_details?.refund_amount || 0} processed after clerkage deduction (not full refund).`}
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Demo Ticket Confirmed!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Your reservation has been recorded in the prototype database.
            </p>
          </>
        )}
      </div>

      {/* Official Journey Brief & Schedule Card */}
      <div className="mb-6 rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-xl relative overflow-hidden text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                Official Journey Brief
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                Trip Schedule & Boarding Brief
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Journey Date: {formattedJourneyDate}</span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 font-bold">
              PNR: {booking.pnr}
            </span>
          </div>
        </div>

        {/* 3-Column Schedule Breakdown */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Boarding Station & Time */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
              <span>Boarding Schedule</span>
              <span className="text-amber-400 font-mono">Platform 2</span>
            </div>
            <div className="text-xs font-black text-white">{booking.boarding_station} ({booking.boarding_station_code})</div>
            <div className="text-xs text-amber-400 font-bold font-mono mt-1">
              Departure: {booking.departure_time}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Date: <strong className="text-slate-200 font-mono">{formattedBoardingDate}</strong>
            </div>
          </div>

          {/* Destination Station & Time */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
              <span>Arrival Schedule</span>
              <span className="text-emerald-400 font-mono">Platform 1</span>
            </div>
            <div className="text-xs font-black text-white">{booking.destination_station} ({booking.destination_station_code})</div>
            <div className="text-xs text-emerald-400 font-bold font-mono mt-1">
              Arrival: {booking.arrival_time}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Date: <strong className="text-slate-200 font-mono">{formattedArrivalDate}</strong>
            </div>
          </div>

          {/* Reservation Specs */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
              <span>Reservation Specs</span>
              <span className="text-emerald-400 font-bold">Confirmed</span>
            </div>
            <div className="text-xs font-bold text-white">{booking.travel_class} • Coach {booking.coach}</div>
            <div className="text-xs text-amber-300 font-mono mt-1">
              Seat/Berth: {booking.seat_berth || booking.berth_number || '34 (Lower)'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {passengerCount} {passengerCount > 1 ? 'Passengers' : 'Passenger'} • Total: <strong className="text-amber-400 font-mono">₹{booking.fare || booking.total_fare}</strong> Paid
            </div>
          </div>
        </div>

        {/* If Connecting Journey: Explicit Connecting Brief */}
        {booking.is_connecting_journey && (
          <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 rotate-90" />
                <span>Connective Journey Breakdown (2 Connected Trains)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                Transfer: <strong className="text-amber-400">{booking.junction_station_name || booking.junction_station_code}</strong> ({booking.layover_duration || '1h 30m'} layover)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-amber-300 font-bold flex items-center justify-between">
                  <span>Leg 1: #{booking.leg1_booking?.train_number || booking.train_number} {booking.leg1_booking?.train_name || booking.train_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{booking.leg1_booking?.coach || booking.coach} / {booking.leg1_booking?.seat_berth || booking.seat_berth}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {booking.boarding_station_code} ({booking.leg1_booking?.departure_time || booking.departure_time}) ➔ {booking.junction_station_code} ({booking.leg1_booking?.arrival_time})
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Departing: <strong className="text-slate-200">{formattedBoardingDate}</strong>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-blue-300 font-bold flex items-center justify-between">
                  <span>Leg 2: #{booking.leg2_booking?.train_number} {booking.leg2_booking?.train_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{booking.leg2_booking?.coach} / {booking.leg2_booking?.seat_berth}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {booking.junction_station_code} ({booking.leg2_booking?.departure_time}) ➔ {booking.destination_station_code} ({booking.leg2_booking?.arrival_time || booking.arrival_time})
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Connecting: <strong className="text-slate-200">{formattedLeg2Date}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main E-Ticket Card (Printable) */}
      <div className={`printable-ticket-card border-2 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100 transition ${
        isCancelled
          ? 'bg-slate-900/95 border-rose-500/40'
          : 'bg-slate-900 border-slate-700'
      }`}>
        {/* Watermark for Cancelled Ticket */}
        {isCancelled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-15 rotate-[-25deg]">
            <span className="text-7xl sm:text-9xl font-black tracking-widest text-rose-500 border-8 border-rose-500 px-6 py-2 rounded-3xl">
              CANCELLED
            </span>
          </div>
        )}

        {/* Ticket Perforation / Notches on sides */}
        <div className="absolute top-1/3 -left-4 w-8 h-8 rounded-full bg-[#0b0f17] border-r-2 border-slate-700 no-print" />
        <div className="absolute top-1/3 -right-4 w-8 h-8 rounded-full bg-[#0b0f17] border-l-2 border-slate-700 no-print" />

        {/* Ticket Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b-2 border-dashed border-slate-700">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
              isCancelled
                ? 'bg-rose-500 text-white'
                : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950'
            }`}>
              <Train className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  TRAIN IN APP
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase">
                  E-Ticket
                </span>
                {isCancelled && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white uppercase animate-pulse">
                    Cancelled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                AI-Powered Smart Railway Project
              </p>
            </div>
          </div>

          {/* PNR & Status */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              PNR NUMBER
            </span>
            <span className="text-xl font-black text-amber-400 font-mono tracking-wider">
              {booking.pnr}
            </span>
            <div className="mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                isCancelled
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {booking.booking_status || 'CONFIRMED'}
              </span>
            </div>
          </div>
        </div>

        {/* Train & Journey Route */}
        <div className="py-6 border-b-2 border-dashed border-slate-700">
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-amber-400">
                #{booking.train_number}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {booking.train_type}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
              {booking.train_name}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center bg-slate-950/70 p-4 rounded-2xl border border-slate-800 font-mono">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">
                Boarding Station
              </span>
              <span className="text-sm font-bold text-white block">
                {booking.boarding_station}
              </span>
              <span className="text-amber-400 text-xs font-bold">
                Dep: {booking.departure_time}
              </span>
              <span className="text-[10px] text-slate-500 block">Platform 2</span>
            </div>

            <div className="text-right sm:text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">
                Destination Station
              </span>
              <span className="text-sm font-bold text-white block">
                {booking.destination_station}
              </span>
              <span className="text-emerald-400 text-xs font-bold">
                Arr: {booking.arrival_time}
              </span>
              <span className="text-[10px] text-slate-500 block">Platform 1</span>
            </div>

            <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 sm:border-l border-slate-800 sm:pl-4 text-xs font-sans">
              <div className="text-slate-400">
                Date: <strong className="text-white font-mono">{booking.journey_date}</strong>
              </div>
              <div className="text-slate-400 mt-1">
                Duration: <strong className="text-white font-mono">{booking.journey_duration}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Leg Connecting Trains Breakdown (if connecting journey) */}
        {booking.is_connecting_journey && (
          <div className="py-5 border-b border-slate-800 bg-slate-950/70 -mx-6 sm:-mx-8 px-6 sm:px-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Two-Leg Connecting Itinerary Breakdown
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Layover: <strong className="text-white">{booking.layover_duration}</strong> at {booking.junction_station_code}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Leg 1 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Leg 1 Train</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {booking.leg1_booking?.travel_class || booking.travel_class}
                    </span>
                    <span className="font-mono text-slate-400 font-bold">#{booking.leg1_booking?.train_number || booking.train_number}</span>
                  </div>
                </div>
                <div className="font-bold text-white text-sm">
                  {booking.leg1_booking?.train_name || booking.train_name}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{booking.boarding_station_code} ({booking.leg1_booking?.departure_time || booking.departure_time})</span>
                  <span className="text-amber-400">➔</span>
                  <span>{booking.junction_station_code} ({booking.leg1_booking?.arrival_time})</span>
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>Coach: <strong className="text-amber-300">{booking.leg1_booking?.coach || 'S2'}</strong></span>
                  <span>Seat: <strong className="text-emerald-300">{booking.leg1_booking?.seat_berth || '34 (Lower)'}</strong></span>
                  {booking.leg1_booking?.fare ? (
                    <span className="text-amber-400 font-mono font-bold">₹{booking.leg1_booking.fare}</span>
                  ) : null}
                </div>
              </div>

              {/* Leg 2 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400">Leg 2 Train</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {booking.leg2_booking?.travel_class || booking.travel_class}
                    </span>
                    <span className="font-mono text-slate-400 font-bold">#{booking.leg2_booking?.train_number}</span>
                  </div>
                </div>
                <div className="font-bold text-white text-sm">
                  {booking.leg2_booking?.train_name || 'Connecting Express'}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{booking.junction_station_code} ({booking.leg2_booking?.departure_time})</span>
                  <span className="text-amber-400">➔</span>
                  <span>{booking.destination_station_code} ({booking.leg2_booking?.arrival_time || booking.arrival_time})</span>
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>Coach: <strong className="text-amber-300">{booking.leg2_booking?.coach || 'B1'}</strong></span>
                  <span>Seat: <strong className="text-emerald-300">{booking.leg2_booking?.seat_berth || '21 (Upper)'}</strong></span>
                  {booking.leg2_booking?.fare ? (
                    <span className="text-emerald-400 font-mono font-bold">₹{booking.leg2_booking.fare}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Passenger & Berth Assignment */}
        <div className="py-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>Booked Passenger Details</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {booking.passengers && booking.passengers.length > 0 ? booking.passengers.length : (booking.passenger_count || 1)} {booking.passengers && booking.passengers.length > 1 ? 'Persons' : 'Person'}
              </span>
            </span>
            <span className="text-xs text-slate-400">
              Class: <strong className="text-white">{booking.travel_class}</strong> • Coach: <strong className="text-amber-400 font-mono">{booking.coach}</strong>
            </span>
          </div>

          {booking.passengers && booking.passengers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Passenger Name</th>
                    <th className="py-2 pr-3">Age / Gender</th>
                    <th className="py-2 pr-3">Aadhaar (Masked)</th>
                    <th className="py-2 pr-3">Coach & Berth</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {booking.passengers.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 pr-3 font-mono font-bold text-amber-400">P{idx + 1}</td>
                      <td className="py-2.5 pr-3 font-bold text-white">
                        {p.name}
                        {idx === 0 && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400">
                            Primary
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">
                        {p.age ? `${p.age} yrs` : '—'} • {p.gender}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-amber-400">{p.masked_aadhaar || '—'}</td>
                      <td className="py-2.5 pr-3 font-mono text-emerald-400 font-bold">
                        {p.coach} / {p.seat_berth}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isCancelled
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isCancelled ? 'CAN' : (p.status || 'CNF')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Passenger Name
                </span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {booking.passenger_name || 'Passenger'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Masked Aadhaar
                </span>
                <span className="text-sm font-bold text-amber-400 font-mono block mt-0.5">
                  {booking.masked_aadhaar || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Class / Coach
                </span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {booking.travel_class} ({booking.coach})
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Seat / Berth
                </span>
                <span className="text-sm font-bold text-emerald-400 font-mono block mt-0.5">
                  {booking.seat_berth || booking.berth_number}
                </span>
              </div>
            </div>
          )}

          {/* Passenger Contact & E-ticket Details (Only show entered details, never assembled defaults) */}
          {(booking.email || booking.phone_number) && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              {booking.phone_number && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Contact Mobile</span>
                  <span className="font-mono text-slate-200 font-bold">{booking.phone_number}</span>
                </div>
              )}
              {booking.email && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Registered E-mail</span>
                  <span className="font-mono text-amber-300 font-medium">{booking.email}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Total Fare Paid:
            </span>
            <span className="text-xl font-black font-mono text-amber-400">
              ₹{booking.fare || booking.total_fare}
            </span>
          </div>
        </div>

        {/* Cancellation & Refund Breakdown if Ticket is Cancelled */}
        {isCancelled && booking.refund_details && (
          <div className="mt-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono space-y-2">
            <div className="flex items-center space-x-2 text-rose-300 font-bold font-sans">
              <Ban className="w-4 h-4" />
              <span>OFFICIAL CANCELLATION & REFUND RECEIPT</span>
            </div>

            <div className="pt-2 border-t border-rose-500/20 space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="font-sans">Original Paid Fare:</span>
                <span>₹{booking.refund_details.original_fare}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span className="font-sans">Cancellation & Clerkage Deduction (Not Full Refund):</span>
                <span>-₹{booking.refund_details.cancellation_fee}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-rose-500/20">
                <span className="font-sans text-white">Net Return Amount:</span>
                <span className={booking.refund_details.refund_denied ? 'text-slate-400' : 'text-emerald-400'}>
                  {booking.refund_details.refund_denied ? '₹0 (Refund Denied)' : `₹${booking.refund_details.refund_amount}`}
                </span>
              </div>
            </div>

            {booking.refund_details.refund_denied ? (
              <div className="mt-2 p-2 rounded-lg bg-rose-500/20 text-rose-200 text-[11px] font-sans">
                ✓ <strong>Passenger Denied Return Amount:</strong> You voluntarily chose to waive the refund of ₹{booking.refund_details.original_fare - booking.refund_details.cancellation_fee}.
              </div>
            ) : (
              <div className="mt-2 p-2 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-sans">
                ✓ <strong>Partial Refund Processed:</strong> ₹{booking.refund_details.refund_amount} credited to original payment mode (deductions applied per railway rules).
              </div>
            )}
          </div>
        )}

        {/* Mandatory College Prototype Warning Disclaimer */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-start space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200 block font-bold mb-0.5">
              PROTOTYPE NOTICE:
            </strong>
            This is only a prototype booking and must not be presented as an actual railway reservation. Generated for academic evaluation only.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2.5 no-print">
        <button
          onClick={handlePrint}
          className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          title="Print official railway e-ticket format"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Print</span>
        </button>

        <button
          onClick={handleDownloadTicket}
          className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          title="Download ticket text file to PC"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download</span>
        </button>

        <button
          onClick={onTrackLive}
          className="py-3 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-amber-400" />
          <span>Track Live</span>
        </button>

        {/* Cancel Ticket & Refund Option */}
        {!isCancelled ? (
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="py-3 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <Ban className="w-4 h-4 text-rose-400" />
            <span>Cancel</span>
          </button>
        ) : (
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Receipt</span>
          </button>
        )}

        <button
          onClick={onBookAnother}
          className="col-span-2 sm:col-span-1 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <span>Plan Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Embedded Vertical Train Location Tracker */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl no-print">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Vertical Live Train Location</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  GPS Active
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {booking.is_connecting_journey
                  ? `Two-Leg Connecting Corridor: ${booking.boarding_station_code} ➔ ${booking.junction_station_code} ➔ ${booking.destination_station_code}`
                  : `Route Corridor: ${booking.boarding_station} ➔ ${booking.destination_station}`}
              </p>
            </div>
          </div>
          <button
            onClick={onTrackLive}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
          >
            <span>Open Interactive Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vertical Track Representation */}
        <div className="py-5 px-2">
          {booking.is_connecting_journey ? (
            <div className="space-y-4">
              {/* Leg 1 Track */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Train className="w-4 h-4" />
                    <span>Leg 1: #{booking.leg1_booking?.train_number || 'Leg 1'} {booking.leg1_booking?.train_name}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    Running On Time (98 km/h)
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-emerald-400 before:to-blue-400">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-slate-950" />
                    <div className="text-xs font-bold text-white">{booking.boarding_station} ({booking.boarding_station_code})</div>
                    <div className="text-[10px] text-slate-400">Departed: {booking.leg1_booking?.departure_time || booking.departure_time} • Platform {booking.leg1_booking?.platform || 2}</div>
                  </div>

                  <div className="relative bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 -ml-2">
                    <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Current Position: Approaching {booking.junction_station_code} (Speed: 104 km/h)</span>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-slate-950" />
                    <div className="text-xs font-bold text-white">{booking.junction_station_name || booking.junction_station_code} (Transfer Junction)</div>
                    <div className="text-[10px] text-slate-400">Scheduled Arrival: {booking.leg1_booking?.arrival_time} • Layover: {booking.layover_duration || '1h 30m'}</div>
                  </div>
                </div>
              </div>

              {/* Leg 2 Track */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-blue-400 flex items-center gap-1.5">
                    <Train className="w-4 h-4" />
                    <span>Leg 2: #{booking.leg2_booking?.train_number || 'Leg 2'} {booking.leg2_booking?.train_name}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                    Connected Leg (Dep: {booking.leg2_booking?.departure_time})
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-400 before:to-emerald-400">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-slate-950" />
                    <div className="text-xs font-bold text-white">{booking.junction_station_name || booking.junction_station_code}</div>
                    <div className="text-[10px] text-slate-400">Departure: {booking.leg2_booking?.departure_time} • Platform {booking.leg2_booking?.platform || 1}</div>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-950" />
                    <div className="text-xs font-bold text-white">{booking.destination_station} ({booking.destination_station_code})</div>
                    <div className="text-[10px] text-slate-400">Final Arrival: {booking.leg2_booking?.arrival_time || booking.arrival_time} • Journey Completed</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-4 text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Train className="w-4 h-4" />
                  <span>#{booking.train_number} {booking.train_name}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  Live: 102 km/h • On Time
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 via-emerald-400 to-blue-400">
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-slate-950" />
                  <div className="text-xs font-bold text-white">{booking.boarding_station} ({booking.boarding_station_code})</div>
                  <div className="text-[10px] text-slate-400">Departure: {booking.departure_time} • Platform 2</div>
                </div>

                <div className="relative bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 -ml-2">
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Train Currently In Transit: Passing Intermediate Corridor (Live Track Active)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Next Signal: Clear Green • Speed: 102 km/h • 0 min delay</div>
                </div>

                <div className="relative">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-slate-950" />
                  <div className="text-xs font-bold text-white">{booking.destination_station} ({booking.destination_station_code})</div>
                  <div className="text-[10px] text-slate-400">Expected Arrival: {booking.arrival_time} • Platform 1</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Copilot Quick Launcher */}
      {onOpenCopilot && (
        <div className="mt-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between no-print">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Need journey assistance or refund clarification?</span>
          </div>
          <button
            onClick={onOpenCopilot}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Railway AI</span>
          </button>
        </div>
      )}

      {/* Simulated Approaching Alert Trigger for Evaluators */}
      {onTriggerApproachingAlert && !isCancelled && (
        <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between no-print">
          <div className="text-xs text-slate-300 flex items-center gap-1.5">
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Test Approaching Notification Alert:</span>
          </div>
          <button
            onClick={onTriggerApproachingAlert}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer"
          >
            Trigger Alert 🔔
          </button>
        </div>
      )}

      {/* Cancellation & Refund Modal */}
      {isCancelModalOpen && (
        <CancelTicketModal
          booking={booking}
          onClose={() => setIsCancelModalOpen(false)}
          onCancellationSuccess={(updated) => {
            if (onUpdateBooking) {
              onUpdateBooking(updated);
            }
          }}
        />
      )}
    </div>
  );
};
