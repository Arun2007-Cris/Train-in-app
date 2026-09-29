export type TrainType =
  | 'Vande Bharat'
  | 'Superfast'
  | 'Express'
  | 'MEMU'
  | 'Jan Shatabdi'
  | 'Tejas'
  | 'Humsafar'
  | 'Rajdhani';

export type TravelClassType =
  | 'AC Compartment'
  | 'Sleeper'
  | 'Second Class'
  | 'Chair Car'
  | 'AC Chair Car'
  | 'Executive Chair Car'
  | 'AC 3 Tier'
  | 'AC 2 Tier'
  | 'First Class'
  | 'First AC';

export type UserPreference =
  | 'Best overall'
  | 'Cheapest'
  | 'Fastest'
  | 'Earliest departure'
  | 'Comfortable journey';

export interface Station {
  station_id: number;
  station_code: string;
  station_name: string;
  city: string;
  state: string;
}

export interface TrainStop {
  stop_id: number;
  train_id: number;
  station_id: number;
  station_code: string;
  station_name: string;
  station_order: number;
  arrival_time: string; // "HH:MM"
  departure_time: string; // "HH:MM"
  distance_km: number;
  distance_from_origin_km?: number;
  day_offset: number; // 0 for same day, 1 for next day (overnight)
  platform_number?: number;
  halt_minutes?: number;
}

export interface TrainClassFare {
  class_id: number;
  train_id: number;
  class_name: TravelClassType;
  base_fare: number;
  fare_per_km: number;
  available_seats: number;
}

export interface CalculatedClass {
  class_name: TravelClassType;
  base_fare?: number;
  fare_per_km?: number;
  fare: number;
  available_seats: number;
}

export interface LiveStatus {
  live_id: number;
  train_id: number;
  current_station: string;
  current_station_code: string;
  next_station: string;
  next_station_code: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  delay_minutes: number;
  status: 'On Time' | 'Delayed' | 'Running' | 'Arrived' | 'Departed';
  last_updated: string;
  passed_station_ids: number[];
  upcoming_station_ids: number[];
  progress_percentage: number; // 0 - 100
}

export interface Train {
  train_id: number;
  train_number: string;
  train_name: string;
  train_type: TrainType;
  source: string;
  source_code: string;
  destination: string;
  destination_code: string;
  description: string;
  runs_on_days: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  stops: TrainStop[];
  classes: TrainClassFare[];
  live_status: LiveStatus;
}

export interface SearchResultTrain extends Train {
  boarding_stop: TrainStop;
  destination_stop: TrainStop;
  journey_distance_km: number;
  departure_time: string;
  arrival_time: string;
  journey_duration: string;
  journey_duration_minutes: number;
  is_overnight: boolean;
  base_fare: number;
  calculated_classes: CalculatedClass[];
  ai_score: number;
  ai_reason: string;
  ai_preference_matches: string[];
  stops_between_count: number;
  intermediate_stops: TrainStop[];
  is_available: boolean;
  availability_status: 'AVAILABLE' | 'NOT_AVAILABLE_HERE' | 'ALREADY_DEPARTED';
  availability_reason?: string;
  reason_code?: 'NO_BOARDING_STOP' | 'NO_DESTINATION_STOP' | 'WRONG_DIRECTION' | 'ALREADY_DEPARTED';
  reason_text?: string;
}

export interface UnavailableTrain {
  train_id: number;
  train_number: string;
  train_name: string;
  train_type: TrainType;
  source: string;
  destination: string;
  reason_code: 'NO_BOARDING_STOP' | 'NO_DESTINATION_STOP' | 'WRONG_DIRECTION' | 'ALREADY_DEPARTED';
  reason_text: string;
  departure_time?: string;
}

export interface SearchTrainsRequest {
  boarding_code: string;
  destination_code: string;
  journey_date: string;
  journey_time: string;
  preference?: UserPreference;
}

export interface ConnectingTrainRoute {
  connection_id: string;
  junction_station_code: string;
  junction_station_name: string;
  junction_city?: string;
  leg1: SearchResultTrain;
  leg2: SearchResultTrain;
  layover_minutes: number;
  layover_duration: string;
  layover_advice: string;
  total_duration_minutes: number;
  total_duration: string;
  total_distance_km: number;
  total_base_fare: number;
  ai_score: number;
  ai_reason: string;
  ai_tags: string[];
  is_viable: boolean;
}

export interface SearchTrainsResponse {
  success: boolean;
  query: SearchTrainsRequest;
  available_trains: SearchResultTrain[];
  connecting_trains?: ConnectingTrainRoute[];
  unavailable_trains: UnavailableTrain[];
  total_found: number;
  has_direct_trains: boolean;
  has_connecting_trains: boolean;
  message?: string;
}

export interface User {
  user_id: number;
  email: string;
  name?: string;
}

export interface Passenger {
  passenger_id?: number;
  user_id?: number;
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  berth_preference?: 'No Preference' | 'Lower' | 'Middle' | 'Upper' | 'Side Lower' | 'Side Upper' | 'Window Seat';
  aadhaar_number: string; // 12 digits unmasked internally
  masked_aadhaar: string; // "XXXX-XXXX-1234"
  phone_number: string;
  email?: string;
}

export interface BookedPassenger {
  passenger_id?: number;
  name: string;
  age?: number;
  gender: string;
  masked_aadhaar: string;
  berth_preference?: string;
  coach: string;
  berth_number: string;
  seat_berth: string;
  status: 'CONFIRMED' | 'RAC' | 'WAITING';
  phone_number?: string;
  email?: string;
}

export interface Booking {
  booking_id: number;
  pnr: string;
  passenger?: Passenger;
  passenger_name?: string;
  masked_aadhaar?: string;
  phone_number?: string;
  email?: string;
  passenger_count?: number;
  passengers?: BookedPassenger[];
  train_id: number;
  train_number: string;
  train_name: string;
  train_type: TrainType | string;
  source?: string;
  destination?: string;
  boarding_station: string;
  boarding_station_code: string;
  destination_station: string;
  destination_station_code: string;
  journey_date: string;
  journey_time?: string;
  departure_time: string;
  arrival_time: string;
  journey_duration?: string;
  travel_class: TravelClassType | string;
  base_fare?: number;
  total_fare?: number;
  fare?: number;
  per_passenger_fare?: number;
  coach: string;
  berth_number?: string;
  seat_berth?: string;
  booking_status: 'CONFIRMED' | 'RAC' | 'WAITING' | 'CANCELLED';
  booked_at: string;
  cancellation_status?: 'NOT_CANCELLED' | 'CANCELLED_PARTIAL_REFUND' | 'CANCELLED_RETURN_DENIED';
  is_connecting_journey?: boolean;
  junction_station_code?: string;
  junction_station_name?: string;
  layover_duration?: string;
  leg1_booking?: {
    train_number: string;
    train_name: string;
    travel_class?: string;
    coach: string;
    seat_berth: string;
    departure_time: string;
    arrival_time: string;
    fare: number;
    platform?: number;
  };
  leg2_booking?: {
    train_number: string;
    train_name: string;
    travel_class?: string;
    coach: string;
    seat_berth: string;
    departure_time: string;
    arrival_time: string;
    fare: number;
    platform?: number;
  };
  connecting_route_data?: ConnectingTrainRoute;
  refund_details?: {
    original_fare: number;
    cancellation_fee: number;
    refund_amount: number;
    refund_denied: boolean;
    reason?: string;
    cancelled_at: string;
  };
}

export interface TrainNotification {
  id: string;
  pnr?: string;
  train_number?: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'approaching' | 'arrival' | 'destination' | 'ticket' | 'delay' | 'cancellation';
  read: boolean;
  ticket?: Booking;
}

export interface NotificationItem {
  id: string;
  pnr?: string;
  train_number: string;
  title: string;
  message: string;
  type: 'APPROACHING' | 'ARRIVED' | 'DESTINATION_NEAR' | 'DELAY_ALERT' | 'INFO' | 'TICKET_CONFIRMED' | 'TICKET_CANCELLED';
  timestamp: string;
  read: boolean;
  ticket?: Booking;
}

export interface AICopilotMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  quickActions?: string[];
}

export interface AIDelayPrediction {
  train_number: string;
  train_name: string;
  confidence_score: number; // 0-100
  predicted_delay_minutes: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  weather_condition: string;
  ai_summary: string;
  connecting_buffer_advice: string;
}

export interface RouteComparisonEvaluation {
  connection_id: string;
  route_label: string;
  junction_station: string;
  total_duration: string;
  layover_duration: string;
  total_fare: number;
  transfer_buffer_status: 'Optimal (30-90m)' | 'Tight (<30m)' | 'Relaxed / Extended (>90m)';
  leg1_summary: string;
  leg2_summary: string;
  speed_comfort_score: number;
  pros: string[];
  cons: string[];
  ai_highlight: string;
}

export interface ConnectingComparisonAIResult {
  ai_winner_connection_id: string;
  verdict_summary: string;
  recommended_reason: string;
  routes: RouteComparisonEvaluation[];
  expert_tips: string[];
  source: 'gemini' | 'rule-engine';
}

export interface AccommodationSuggestion {
  id: string;
  name: string;
  category: 'IRCTC Executive Pod' | 'Station Retiring Room' | 'Hotel' | 'Serviced Apartment';
  distance_from_station: string;
  rating: number;
  review_count: number;
  pricing: string;
  pricing_badge: string;
  amenities: string[];
  ai_transit_highlight: string;
  address: string;
  contact_or_booking: string;
}

export interface HotelSuggestionsResult {
  station_code: string;
  station_name: string;
  city: string;
  is_junction: boolean;
  ai_overview: string;
  accommodations: AccommodationSuggestion[];
  source: 'gemini' | 'rule-engine';
}

