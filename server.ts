import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { STATIONS, INITIAL_TRAINS } from './server/railwayData.ts';
import { searchAndEvaluateTrains, findConnectingTrainRoutes } from './server/aiEngine.ts';
import { askTrainCopilot, predictTrainJourneyAI, compareConnectingRoutesAI, suggestHotelsAndApartmentsAI } from './server/geminiService.ts';
import type { Booking, Passenger, NotificationItem, User } from './src/types.ts';

// In-memory data store for the prototype session
let trains = JSON.parse(JSON.stringify(INITIAL_TRAINS));
const users: User[] = [
  { user_id: 1, email: 'demo@traininapp.edu', name: 'Arun Ponnan' },
  { user_id: 2, email: 'student@college.edu', name: 'Railway Project Tester' },
];

let passengers: Record<number, Passenger> = {};

const bookings: Record<string, Booking> = {};
const notifications: Record<string, NotificationItem[]> = {};

function maskAadhaar(aadhaar: string): string {
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length >= 4) {
    const last4 = clean.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }
  return 'XXXX-XXXX-XXXX';
}

function generatePNR(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `TI${randomNum}`;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'Train In App',
      version: '1.0.0-college-prototype',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Stations API
  app.get('/api/stations', (req, res) => {
    res.json({
      success: true,
      stations: STATIONS,
    });
  });

  // 3. Login API
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Prototype demo authentication (supports demo credentials or any valid email for testing)
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        user_id: users.length + 1,
        email,
        name: email.split('@')[0],
      };
      users.push(user);
    }

    return res.json({
      success: true,
      message: 'Authentication successful',
      user,
      token: 'demo-session-token-' + user.user_id,
    });
  });

  // 4. Passenger API
  app.post('/api/passenger', (req, res) => {
    const { user_id, name, aadhaar_number, phone_number, email } = req.body;
    if (!name || !aadhaar_number || !phone_number) {
      return res.status(400).json({ success: false, message: 'All passenger fields are required' });
    }

    const passengerId = Object.keys(passengers).length + 1;
    const masked = maskAadhaar(aadhaar_number);

    const passenger: Passenger = {
      passenger_id: passengerId,
      user_id: user_id || 1,
      name: name.trim(),
      aadhaar_number: aadhaar_number.replace(/\s+/g, ''),
      masked_aadhaar: masked,
      phone_number: phone_number.trim(),
      email: email ? email.trim() : undefined,
    };

    passengers[passengerId] = passenger;

    return res.json({
      success: true,
      message: 'Passenger details verified and saved',
      passenger,
    });
  });

  // 5. Search Trains API (Smart train availability logic + AI engine)
  app.post('/api/search-trains', (req, res) => {
    const {
      boarding_code,
      destination_code,
      journey_date,
      journey_time,
      preference,
      class_filter,
      type_filter,
      include_departed,
    } = req.body;

    if (!boarding_code || !destination_code) {
      return res.status(400).json({
        success: false,
        message: 'Boarding station and destination station codes are required',
      });
    }

    if (boarding_code.toUpperCase() === destination_code.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Boarding and destination stations cannot be the same',
      });
    }

    const result = searchAndEvaluateTrains(trains, {
      boarding_code,
      destination_code,
      journey_date: journey_date || new Date().toISOString().split('T')[0],
      journey_time: journey_time || '08:00',
      preference: preference || 'Best overall',
      class_filter,
      type_filter,
      include_departed: !!include_departed,
    });

    // Apply optional client filters if supplied
    let filteredAvailable = result.available_trains;
    if (type_filter && type_filter !== 'All') {
      filteredAvailable = filteredAvailable.filter((t) => t.train_type === type_filter);
    }
    if (class_filter && class_filter !== 'All') {
      filteredAvailable = filteredAvailable.filter((t) =>
        t.calculated_classes.some((c) => c.class_name.toLowerCase().includes(class_filter.toLowerCase()))
      );
    }

    const hasDirect = filteredAvailable.length > 0;
    const connectingRoutes = result.connecting_trains || [];

    return res.json({
      success: true,
      query: {
        boarding_code: boarding_code.toUpperCase(),
        destination_code: destination_code.toUpperCase(),
        journey_date,
        journey_time,
        preference: preference || 'Best overall',
      },
      available_trains: filteredAvailable,
      connecting_trains: connectingRoutes,
      unavailable_trains: result.unavailable_trains,
      total_found: filteredAvailable.length,
      has_direct_trains: hasDirect,
      has_connecting_trains: connectingRoutes.length > 0,
      message: !hasDirect && connectingRoutes.length > 0
        ? `No direct train on this corridor; displaying ${connectingRoutes.length} smart connecting train routes.`
        : undefined,
    });
  });

  // Dedicated Connecting Trains Endpoint for any station pair or location details
  app.post('/api/connecting-trains', (req, res) => {
    const boarding_code = req.body.boarding_code || req.body.from_code;
    const destination_code = req.body.destination_code || req.body.to_code;
    const { journey_date, journey_time, preference } = req.body;
    if (!boarding_code || !destination_code) {
      return res.status(400).json({ success: false, message: 'Both boarding and destination codes required' });
    }

    const connectingRoutes = findConnectingTrainRoutes(trains, {
      boarding_code,
      destination_code,
      journey_date: journey_date || new Date().toISOString().split('T')[0],
      journey_time: journey_time || '08:00',
      preference: preference || 'Best overall',
    });

    return res.json({
      success: true,
      query: {
        boarding_code: boarding_code.toUpperCase(),
        destination_code: destination_code.toUpperCase(),
      },
      connecting_trains: connectingRoutes,
      total_found: connectingRoutes.length,
    });
  });

  // Dedicated Advanced AI Connecting Routes Comparison Endpoint
  app.post('/api/compare-connecting', async (req, res) => {
    try {
      const { routes, preference } = req.body;
      if (!routes || !Array.isArray(routes) || routes.length === 0) {
        return res.status(400).json({ success: false, message: 'Routes array required for comparison' });
      }

      const comparison = await compareConnectingRoutesAI(routes, preference || 'Best overall');
      return res.json({
        success: true,
        comparison,
      });
    } catch (err: any) {
      console.error('[API] Connecting comparison error:', err);
      return res.status(500).json({ success: false, message: err?.message || 'Comparison failed' });
    }
  });

  // Dedicated Advanced AI Hotel & Apartment Suggestions Endpoint
  app.post('/api/suggest-hotels', async (req, res) => {
    try {
      const { station_code, station_name, city, is_junction, layover_duration, journey_date } = req.body;
      if (!station_code) {
        return res.status(400).json({ success: false, message: 'Station code required' });
      }

      // Look up station name & city if not passed
      const stn = STATIONS.find(s => s.station_code.toUpperCase() === station_code.toUpperCase());
      const resolvedName = station_name || stn?.station_name || station_code;
      const resolvedCity = city || stn?.city || resolvedName;

      const result = await suggestHotelsAndApartmentsAI(
        station_code.toUpperCase(),
        resolvedName,
        resolvedCity,
        {
          is_junction: !!is_junction,
          layover_duration,
          journey_date,
        }
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('[API] Hotel suggestion error:', err);
      return res.status(500).json({ success: false, message: err?.message || 'Hotel suggestion failed' });
    }
  });

  // 6. Get Train by ID
  app.get('/api/trains/:train_id', (req, res) => {
    const trainId = Number(req.params.train_id);
    const train = trains.find((t: any) => t.train_id === trainId);
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    return res.json({ success: true, train });
  });

  // 7. Get Train Live Status
  app.get('/api/trains/:train_id/live', (req, res) => {
    const trainId = Number(req.params.train_id);
    const train = trains.find((t: any) => t.train_id === trainId);
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    return res.json({
      success: true,
      train_id: train.train_id,
      train_number: train.train_number,
      train_name: train.train_name,
      live_status: train.live_status,
      disclaimer: 'Demo / Simulated Live Status for College Project',
    });
  });

  // 8. Get Train Classes
  app.get('/api/trains/:train_id/classes', (req, res) => {
    const trainId = Number(req.params.train_id);
    const train = trains.find((t: any) => t.train_id === trainId);
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    return res.json({
      success: true,
      classes: train.classes,
    });
  });

  // 9. Book Train API
  app.post('/api/book', (req, res) => {
    const {
      passenger,
      passengers,
      passenger_count,
      passenger_name,
      masked_aadhaar,
      phone_number,
      train_id,
      boarding_station,
      destination_station,
      journey_date,
      journey_time,
      travel_class,
      fare,
      per_passenger_fare,
    } = req.body;

    // Resolve primary passenger (never assemble default dummy data; show only provided details)
    const primaryPassenger = passenger || (passengers && passengers[0]) || {
      name: passenger_name || '',
      masked_aadhaar: masked_aadhaar || '',
      phone_number: phone_number || '',
      email: req.body.email || '',
    };

    if (!primaryPassenger.name || !train_id || !travel_class || (!fare && fare !== 0)) {
      return res.status(400).json({ success: false, message: 'Missing required booking information' });
    }

    const train = trains.find((t: any) => t.train_id === Number(train_id));
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    const pnr = generatePNR();
    const coaches = travel_class.includes('AC')
      ? ['B1', 'B2', 'A1', 'M1']
      : travel_class.includes('Chair')
      ? ['C1', 'C2', 'E1']
      : travel_class.includes('Executive')
      ? ['EC1', 'EC2']
      : travel_class.includes('Sleeper')
      ? ['S1', 'S2', 'S3', 'S4']
      : ['GS1', 'GS2'];

    const chosenCoach = req.body.coach || coaches[Math.floor(Math.random() * coaches.length)];
    const berthNum = Math.floor(1 + Math.random() * 72).toString();

    // Process all passengers with only their entered details
    const rawList = (passengers && passengers.length > 0) ? passengers : [primaryPassenger];
    const bookedPassengers = rawList.map((p: any, idx: number) => {
      const seat = Math.floor(1 + Math.random() * 60) + idx;
      const pref = p.berth_preference && p.berth_preference !== 'No Preference'
        ? p.berth_preference
        : (idx % 2 === 0 ? 'Lower' : 'Middle');
      const cleanAadhaar = p.aadhaar_number ? String(p.aadhaar_number).replace(/\D/g, '') : '';
      const displayAadhaar = cleanAadhaar ? maskAadhaar(cleanAadhaar) : (p.masked_aadhaar || '—');

      return {
        passenger_id: p.passenger_id || idx + 1,
        name: p.name || `Passenger ${idx + 1}`,
        age: Number(p.age) || undefined,
        gender: p.gender || 'Male',
        masked_aadhaar: displayAadhaar,
        berth_preference: p.berth_preference || 'No Preference',
        coach: chosenCoach,
        berth_number: `${seat}`,
        seat_berth: `${seat} (${pref})`,
        status: 'CONFIRMED',
        phone_number: p.phone_number || primaryPassenger.phone_number || '',
        email: p.email || primaryPassenger.email || req.body.email || '',
      };
    });

    const finalCount = passenger_count || bookedPassengers.length;
    const finalFare = Number(fare);
    const primAadhaar = primaryPassenger.aadhaar_number ? String(primaryPassenger.aadhaar_number).replace(/\D/g, '') : '';
    const primMaskedAadhaar = primAadhaar ? maskAadhaar(primAadhaar) : (primaryPassenger.masked_aadhaar || '—');

    const booking: Booking = {
      booking_id: Object.keys(bookings).length + 1,
      pnr,
      passenger: {
        name: primaryPassenger.name,
        aadhaar_number: primAadhaar,
        masked_aadhaar: primMaskedAadhaar,
        phone_number: primaryPassenger.phone_number || '',
        email: primaryPassenger.email || req.body.email || '',
      },
      passenger_name: primaryPassenger.name,
      masked_aadhaar: primMaskedAadhaar,
      phone_number: primaryPassenger.phone_number || '',
      email: primaryPassenger.email || req.body.email || '',
      passenger_count: finalCount,
      passengers: bookedPassengers,
      train_id: train.train_id,
      train_number: req.body.train_number || train.train_number,
      train_name: req.body.train_name || train.train_name,
      train_type: req.body.train_type || train.train_type,
      source: req.body.source || train.source,
      destination: req.body.destination || train.destination,
      boarding_station: boarding_station || train.source,
      boarding_station_code: req.body.boarding_station_code || 'SRR',
      destination_station: destination_station || train.destination,
      destination_station_code: req.body.destination_station_code || 'TPJ',
      journey_date: journey_date || new Date().toISOString().split('T')[0],
      journey_time: journey_time || '12:00',
      departure_time: req.body.departure_time || '12:15',
      arrival_time: req.body.arrival_time || '20:10',
      journey_duration: req.body.journey_duration || '7h 55m',
      travel_class: req.body.leg1_booking && req.body.leg2_booking && req.body.leg1_booking.travel_class && req.body.leg2_booking.travel_class && req.body.leg1_booking.travel_class !== req.body.leg2_booking.travel_class
        ? `${req.body.leg1_booking.travel_class} (Leg 1) + ${req.body.leg2_booking.travel_class} (Leg 2)`
        : (req.body.travel_class || travel_class),
      base_fare: Number(req.body.base_fare || finalFare * 0.4),
      total_fare: finalFare,
      fare: finalFare,
      per_passenger_fare: Number(per_passenger_fare || Math.round(finalFare / finalCount)),
      coach: chosenCoach,
      berth_number: bookedPassengers[0]?.berth_number || berthNum,
      seat_berth: bookedPassengers[0]?.seat_berth || `${berthNum} (Lower)`,
      booking_status: 'CONFIRMED',
      booked_at: new Date().toISOString(),
      is_connecting_journey: !!req.body.is_connecting_journey,
      junction_station_code: req.body.junction_station_code,
      junction_station_name: req.body.junction_station_name,
      layover_duration: req.body.layover_duration,
      leg1_booking: req.body.leg1_booking ? {
        ...req.body.leg1_booking,
        travel_class: req.body.leg1_booking.travel_class || travel_class,
      } : undefined,
      leg2_booking: req.body.leg2_booking ? {
        ...req.body.leg2_booking,
        travel_class: req.body.leg2_booking.travel_class || travel_class,
      } : undefined,
    };

    bookings[pnr] = booking;

    // Seed initial notifications containing the demo ticket for this booked train
    const ticketNotifTitle = booking.is_connecting_journey
      ? '🎟️ Connected Journey Completely Booked'
      : '🎟️ Demo Ticket Issued & Stored (Backend)';
    const ticketNotifMsg = booking.is_connecting_journey
      ? `Your complete connecting journey from ${booking.boarding_station} to ${booking.destination_station} via ${booking.junction_station_code} has been completely booked for all ${finalCount} passenger(s). Total Amount Paid: ₹${booking.total_fare}.`
      : `Your demo ticket for ${train.train_name} (#${train.train_number}) from ${booking.boarding_station} to ${booking.destination_station} has been generated and confirmed in the server database. Coach: ${chosenCoach}, Berth/Seat: ${booking.berth_number || booking.seat_berth}. Total Fare: ₹${booking.total_fare}.`;

    const ticketNotif: NotificationItem = {
      id: `notif-ticket-${pnr}`,
      pnr,
      train_number: train.train_number,
      title: ticketNotifTitle,
      message: ticketNotifMsg,
      type: 'TICKET_CONFIRMED',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      ticket: booking,
    };

    const approachNotif: NotificationItem = {
      id: `notif-approach-${pnr}`,
      pnr,
      train_number: train.train_number,
      title: 'Train Approaching Alert',
      message: `🔔 Your train #${train.train_number} is approaching ${booking.boarding_station}. Please be ready on Platform 2 with your ticket.`,
      type: 'APPROACHING',
      timestamp: 'Scheduled Alert',
      read: false,
      ticket: booking,
    };

    const arrivedNotif: NotificationItem = {
      id: `notif-arrived-${pnr}`,
      pnr,
      train_number: train.train_number,
      title: 'Train Arrived Alert',
      message: `🔔 ${train.train_number} has arrived at ${booking.boarding_station}. Halting for scheduled departure.`,
      type: 'ARRIVED',
      timestamp: 'Scheduled Alert',
      read: false,
      ticket: booking,
    };

    const destNotif: NotificationItem = {
      id: `notif-dest-${pnr}`,
      pnr,
      train_number: train.train_number,
      title: 'Destination Near Alert',
      message: `🔔 Your destination (${booking.destination_station}) is approaching in 15 minutes. Keep ticket PNR ${pnr} ready.`,
      type: 'DESTINATION_NEAR',
      timestamp: 'Simulated Alert',
      read: false,
      ticket: booking,
    };

    notifications[pnr] = [ticketNotif, approachNotif, arrivedNotif, destNotif];

    return res.json({
      success: true,
      message: 'Demo ticket generated and stored in backend successfully',
      pnr,
      booking,
      notification: ticketNotif,
      notifications: notifications[pnr],
    });
  });

  // 10. Get Booking by PNR
  app.get('/api/booking/:pnr', (req, res) => {
    const pnr = req.params.pnr.toUpperCase();
    const booking = bookings[pnr];
    if (!booking) {
      return res.status(404).json({ success: false, message: 'PNR not found in prototype database' });
    }
    return res.json({
      success: true,
      booking,
      disclaimer: 'This is only a prototype booking and must not be presented as an actual railway reservation.',
    });
  });

  // 11. Get all tickets stored in backend
  app.get('/api/tickets', (req, res) => {
    const allBookings = Object.values(bookings).reverse();
    return res.json({
      success: true,
      tickets: allBookings,
    });
  });

  // 12. Get notifications for PNR or all general notifications
  app.get('/api/notifications', (req, res) => {
    const allNotifs = Object.values(notifications).flat().reverse();
    return res.json({
      success: true,
      notifications: allNotifs,
    });
  });

  app.get('/api/notifications/:pnr', (req, res) => {
    const pnr = req.params.pnr.toUpperCase();
    const notifs = notifications[pnr] || [];
    return res.json({
      success: true,
      notifications: notifs,
    });
  });

  // 12. Simulate Live Location Step
  app.post('/api/simulate-step', (req, res) => {
    const { train_id, advance_stops } = req.body;
    const train = trains.find((t: any) => t.train_id === Number(train_id));
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    const currentOrder = train.stops.find((s: any) => s.station_code === train.live_status.current_station_code)?.station_order || 1;
    const nextIndex = Math.min(train.stops.length - 1, currentOrder);
    const newCurrent = train.stops[nextIndex];
    const newNext = train.stops[Math.min(train.stops.length - 1, nextIndex + 1)];

    train.live_status.current_station = newCurrent.station_name;
    train.live_status.current_station_code = newCurrent.station_code;
    train.live_status.next_station = newNext.station_name;
    train.live_status.next_station_code = newNext.station_code;
    train.live_status.progress_percentage = Math.min(100, Math.round(((nextIndex + 1) / train.stops.length) * 100));
    train.live_status.last_updated = 'Just now (Simulated)';

    // Update passed stations
    const passed: number[] = [];
    const upcoming: number[] = [];
    train.stops.forEach((s: any, idx: number) => {
      if (idx <= nextIndex) passed.push(s.station_id);
      else upcoming.push(s.station_id);
    });
    train.live_status.passed_station_ids = passed;
    train.live_status.upcoming_station_ids = upcoming;

    return res.json({
      success: true,
      live_status: train.live_status,
      message: `Simulated advance to ${newCurrent.station_name}`,
    });
  });

  // 13. Cancel Ticket & Refund Handler (Partial Refund vs Deny Return Amount)
  app.post('/api/cancel-ticket', (req, res) => {
    const { pnr, returnAction, reason } = req.body;
    if (!pnr) {
      return res.status(400).json({ success: false, message: 'PNR is required' });
    }

    const cleanPNR = String(pnr).toUpperCase();
    const booking = bookings[cleanPNR];
    if (!booking) {
      return res.status(404).json({ success: false, message: `Ticket with PNR ${cleanPNR} not found in database.` });
    }

    if (booking.booking_status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This ticket has already been cancelled.',
        booking,
      });
    }

    const totalFare = Number(booking.total_fare || booking.fare || 0);
    const passCount = booking.passengers && booking.passengers.length > 0 ? booking.passengers.length : (booking.passenger_count || 1);
    const travelClass = (booking.travel_class || '').toUpperCase();

    // Standard Railway Clerkage / Cancellation Fee Calculation
    let perPersonClerkage = 60; // 2S / Second class
    if (travelClass.includes('SL') || travelClass.includes('SLEEPER')) {
      perPersonClerkage = 120;
    } else if (travelClass.includes('3A') || travelClass.includes('CC') || travelClass.includes('3 TIER')) {
      perPersonClerkage = 180;
    } else if (travelClass.includes('2A') || travelClass.includes('2 TIER')) {
      perPersonClerkage = 200;
    } else if (travelClass.includes('1A') || travelClass.includes('EC') || travelClass.includes('FIRST')) {
      perPersonClerkage = 240;
    }

    // Minimum clerkage or 25% cancellation charge
    const totalClerkage = Math.min(totalFare, Math.max(perPersonClerkage * passCount, Math.round(totalFare * 0.25)));
    const eligiblePartialRefund = Math.max(0, totalFare - totalClerkage);

    const refundDenied = returnAction === 'DENY_RETURN_AMOUNT';
    const finalRefundAmount = refundDenied ? 0 : eligiblePartialRefund;

    const cancellationStatus = refundDenied ? 'CANCELLED_RETURN_DENIED' : 'CANCELLED_PARTIAL_REFUND';

    booking.booking_status = 'CANCELLED';
    booking.cancellation_status = cancellationStatus;
    booking.refund_details = {
      original_fare: totalFare,
      cancellation_fee: totalClerkage,
      refund_amount: finalRefundAmount,
      refund_denied: refundDenied,
      reason: reason || (refundDenied ? 'Passenger voluntarily chose to deny return amount.' : 'Passenger initiated partial refund cancellation.'),
      cancelled_at: new Date().toISOString(),
    };

    // Push notification to PNR and global drawer
    const cancellationNotif: NotificationItem = {
      id: `notif-cancel-${cleanPNR}-${Date.now()}`,
      pnr: cleanPNR,
      train_number: booking.train_number,
      title: refundDenied ? 'Ticket Cancelled (Return Amount Denied)' : 'Ticket Cancelled (Partial Refund Processed)',
      message: refundDenied
        ? `Ticket PNR ${cleanPNR} has been cancelled. Passenger opted to deny the return amount (₹${eligiblePartialRefund} waived).`
        : `Ticket PNR ${cleanPNR} has been cancelled. Partial refund of ₹${finalRefundAmount} processed (Deduction: ₹${totalClerkage} clerkage charge; not a full refund).`,
      type: 'TICKET_CANCELLED',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      ticket: booking,
    };

    if (!notifications[cleanPNR]) notifications[cleanPNR] = [];
    notifications[cleanPNR].unshift(cancellationNotif);

    return res.json({
      success: true,
      message: refundDenied
        ? 'Ticket cancelled successfully. Return amount was denied by passenger.'
        : `Ticket cancelled successfully. Partial refund of ₹${finalRefundAmount} processed after ₹${totalClerkage} deduction (not full refund).`,
      booking,
      refund_details: booking.refund_details,
      notification: cancellationNotif,
    });
  });

  // 14. AI Train Copilot Q&A (Powered by Gemini AI)
  app.post('/api/ai/copilot', async (req, res) => {
    try {
      const { question, context } = req.body;
      if (!question) {
        return res.status(400).json({ success: false, message: 'Question is required' });
      }
      const answer = await askTrainCopilot(question, context);
      return res.json({
        success: true,
        answer: answer.text,
        text: answer.text,
        source: answer.source,
        quickSuggestions: answer.quickSuggestions,
        type: answer.type || 'text',
        sourceStation: answer.sourceStation,
        destinationStation: answer.destinationStation,
        trains: answer.trains,
        recommendations: answer.recommendations,
        referencedTrain: answer.referencedTrain,
        explanation: answer.explanation,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e?.message || 'AI Copilot error' });
    }
  });

  // 15. AI Journey Delay & Route Prediction
  app.post('/api/ai/predict', async (req, res) => {
    try {
      const { train } = req.body;
      if (!train) {
        return res.status(400).json({ success: false, message: 'Train object is required' });
      }
      const prediction = await predictTrainJourneyAI(train);
      return res.json({
        success: true,
        prediction,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e?.message || 'AI Predict error' });
    }
  });

  // Catch-all for API endpoints to prevent falling through to Vite SPA html
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Global error handler returning JSON instead of Express default HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express API error:', err);
    res.status(500).json({
      success: false,
      message: err?.message || 'Internal Server Error',
    });
  });

  // Vite middleware for development vs static build in production (Cloud Run)
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && fs.existsSync(indexHtmlPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚆 TRAIN IN APP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
