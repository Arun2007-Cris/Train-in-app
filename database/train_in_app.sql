-- ==========================================================
-- TRAIN IN APP — Database Schema & Seed Data (MySQL)
-- College Project: AI-Powered Train Search & Booking System
-- ==========================================================

CREATE DATABASE IF NOT EXISTS train_in_app;
USE train_in_app;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PASSENGERS TABLE
CREATE TABLE IF NOT EXISTS PASSENGERS (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    aadhaar_number VARCHAR(12) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- 3. STATIONS TABLE
CREATE TABLE IF NOT EXISTS STATIONS (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    station_code VARCHAR(10) NOT NULL UNIQUE,
    station_name VARCHAR(150) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100)
);

-- 4. TRAINS TABLE
CREATE TABLE IF NOT EXISTS TRAINS (
    train_id INT AUTO_INCREMENT PRIMARY KEY,
    train_number VARCHAR(20) NOT NULL UNIQUE,
    train_name VARCHAR(150) NOT NULL,
    train_type ENUM('Vande Bharat', 'Superfast', 'Express', 'MEMU', 'Jan Shatabdi', 'Tejas', 'Humsafar', 'Rajdhani') NOT NULL,
    source VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TRAIN_STOPS TABLE
CREATE TABLE IF NOT EXISTS TRAIN_STOPS (
    stop_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    station_id INT NOT NULL,
    station_order INT NOT NULL,
    arrival_time TIME NOT NULL,
    departure_time TIME NOT NULL,
    distance_km INT DEFAULT 0,
    day_offset INT DEFAULT 0,
    FOREIGN KEY (train_id) REFERENCES TRAINS(train_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES STATIONS(station_id) ON DELETE CASCADE
);

-- 6. TRAIN_CLASSES TABLE
CREATE TABLE IF NOT EXISTS TRAIN_CLASSES (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    class_name ENUM('AC Compartment', 'Sleeper', 'Second Class', 'Chair Car', 'Executive Chair Car') NOT NULL,
    base_fare DECIMAL(10,2) NOT NULL,
    fare_per_km DECIMAL(10,2) NOT NULL,
    available_seats INT DEFAULT 100,
    FOREIGN KEY (train_id) REFERENCES TRAINS(train_id) ON DELETE CASCADE
);

-- 7. LIVE_STATUS TABLE
CREATE TABLE IF NOT EXISTS LIVE_STATUS (
    live_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL UNIQUE,
    current_station VARCHAR(150) NOT NULL,
    next_station VARCHAR(150) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    speed INT DEFAULT 0,
    delay_minutes INT DEFAULT 0,
    status ENUM('On Time', 'Delayed', 'Running', 'Arrived', 'Departed') DEFAULT 'On Time',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES TRAINS(train_id) ON DELETE CASCADE
);

-- 8. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS BOOKINGS (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    passenger_id INT NOT NULL,
    train_id INT NOT NULL,
    boarding_station VARCHAR(150) NOT NULL,
    destination_station VARCHAR(150) NOT NULL,
    journey_date DATE NOT NULL,
    journey_time TIME NOT NULL,
    travel_class VARCHAR(50) NOT NULL,
    fare DECIMAL(10,2) NOT NULL,
    pnr VARCHAR(20) NOT NULL UNIQUE,
    booking_status ENUM('CONFIRMED', 'RAC', 'WAITING') DEFAULT 'CONFIRMED',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES PASSENGERS(passenger_id) ON DELETE CASCADE,
    FOREIGN KEY (train_id) REFERENCES TRAINS(train_id) ON DELETE CASCADE
);

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- Seed Users
INSERT INTO USERS (user_id, email, password_hash) VALUES
(1, 'demo@traininapp.edu', '$2b$12$e8YQd98f7e91h2...'),
(2, 'arun@example.com', '$2b$12$f0Za123b4c5d6...');

-- Seed Passengers
INSERT INTO PASSENGERS (passenger_id, user_id, name, aadhaar_number, phone_number) VALUES
(1, 1, 'Arun Ponnan', '548291038472', '9847123456'),
(2, 2, 'Priya Sharma', '763910294821', '9876543210');

-- Seed Stations
INSERT INTO STATIONS (station_id, station_code, station_name, city, state) VALUES
(1, 'MAQ', 'Mangaluru Central', 'Mangaluru', 'Karnataka'),
(2, 'CAN', 'Kannur Main', 'Kannur', 'Kerala'),
(3, 'CLT', 'Kozhikode Main', 'Kozhikode', 'Kerala'),
(4, 'TIR', 'Tirur', 'Tirur', 'Kerala'),
(5, 'SRR', 'Shoranur Junction', 'Shoranur', 'Kerala'),
(6, 'PGT', 'Palakkad Junction', 'Palakkad', 'Kerala'),
(7, 'CBE', 'Coimbatore Junction', 'Coimbatore', 'Tamil Nadu'),
(8, 'TUP', 'Tiruppur', 'Tiruppur', 'Tamil Nadu'),
(9, 'ED', 'Erode Junction', 'Erode', 'Tamil Nadu'),
(10, 'SA', 'Salem Junction', 'Salem', 'Tamil Nadu'),
(11, 'KRR', 'Karur Junction', 'Karur', 'Tamil Nadu'),
(12, 'TPJ', 'Tiruchchirappalli Junction (Trichy)', 'Tiruchirappalli', 'Tamil Nadu'),
(13, 'TJ', 'Thanjavur Junction', 'Thanjavur', 'Tamil Nadu'),
(14, 'KIK', 'Karaikal', 'Karaikal', 'Puducherry'),
(15, 'ERS', 'Ernakulam Junction', 'Kochi', 'Kerala'),
(16, 'TCR', 'Thrissur', 'Thrissur', 'Kerala'),
(17, 'TVC', 'Thiruvananthapuram Central', 'Thiruvananthapuram', 'Kerala'),
(18, 'MS', 'Chennai Egmore', 'Chennai', 'Tamil Nadu'),
(19, 'MAS', 'M.G.R. Chennai Central', 'Chennai', 'Tamil Nadu'),
(20, 'PDY', 'Puducherry', 'Puducherry', 'Puducherry'),
(21, 'MDU', 'Madurai Junction', 'Madurai', 'Tamil Nadu'),
(22, 'RMM', 'Rameswaram', 'Rameswaram', 'Tamil Nadu'),
(23, 'QLN', 'Kollam Junction', 'Kollam', 'Kerala'),
(24, 'ALLP', 'Alappuzha', 'Alappuzha', 'Kerala');

-- Seed Trains
INSERT INTO TRAINS (train_id, train_number, train_name, train_type, source, destination, description) VALUES
(1, '16159', 'MS–MAQ Express', 'Express', 'Chennai Egmore', 'Mangaluru Central', 'Overnight express via Trichy, Coimbatore, Palakkad and Shoranur.'),
(2, '16160', 'MAQ–Chennai Express', 'Express', 'Mangaluru Central', 'Chennai Egmore', 'Daily express from Mangaluru to Chennai.'),
(3, '20631', 'MAQ–TVC Vande Bharat Express', 'Vande Bharat', 'Mangaluru Central', 'Thiruvananthapuram Central', 'Flagship semi-high speed train with 160 kmph capability.'),
(4, '20632', 'TVC–MAQ Vande Bharat Express', 'Vande Bharat', 'Thiruvananthapuram Central', 'Mangaluru Central', 'High-speed coastal express with world-class amenities.'),
(5, '16188', 'ERS–Karaikal Express', 'Express', 'Ernakulam Junction', 'Karaikal', 'Night express connecting Kerala to Karaikal port via Shoranur and Trichy.'),
(6, '16187', 'KIK–ERS Express', 'Express', 'Karaikal', 'Ernakulam Junction', 'Overnight train connecting Delta districts to Central Kerala.'),
(7, '16650', 'Parasuram Express', 'Express', 'Mangaluru Central', 'Thiruvananthapuram Central', 'Iconic daytime passenger express across Kerala.'),
(8, '12695', 'MAS–TVC Superfast Express', 'Superfast', 'M.G.R. Chennai Central', 'Thiruvananthapuram Central', 'Premier overnight Superfast via Coimbatore, Palakkad and Thrissur.'),
(9, '12431', 'Thiruvananthapuram Rajdhani Express', 'Rajdhani', 'Thiruvananthapuram Central', 'Mangaluru Central', 'Premier fully air-conditioned express with highest priority.'),
(10, '12076', 'Kozhikode–TVC Jan Shatabdi', 'Jan Shatabdi', 'Kozhikode Main', 'Thiruvananthapuram Central', 'High-speed affordable daytime intercity express.'),
(11, '66605', 'PGT–SRR MEMU Passenger', 'MEMU', 'Palakkad Junction', 'Shoranur Junction', 'Frequent suburban commuter shuttle between Palakkad and Shoranur.'),
(12, '66604', 'SRR–PGT MEMU Passenger', 'MEMU', 'Shoranur Junction', 'Palakkad Junction', 'Suburban commuter shuttle from Shoranur to Palakkad.'),
(13, '22671', 'Chennai–Madurai Tejas Express', 'Tejas', 'Chennai Egmore', 'Madurai Junction', 'Ultra-modern high speed express with automatic doors and gourmet catering.'),
(14, '20665', 'Chennai Egmore–Tirunelveli Vande Bharat', 'Vande Bharat', 'Chennai Egmore', 'Madurai Junction', 'High-speed Vande Bharat connecting Chennai to South Tamil Nadu.'),
(15, '16617', 'RMM–CBE Express', 'Express', 'Rameswaram', 'Coimbatore Junction', 'Overnight link connecting Rameswaram and Madurai to Coimbatore.'),
(16, '22833', 'Humsafar Express', 'Humsafar', 'M.G.R. Chennai Central', 'Ernakulam Junction', 'All-AC 3-Tier luxury train equipped with modern amenities.');

-- Seed Stops for 16159 MS-MAQ Express
INSERT INTO TRAIN_STOPS (train_id, station_id, station_order, arrival_time, departure_time, distance_km, day_offset) VALUES
(1, 18, 1, '23:15:00', '23:30:00', 0, 0),
(1, 12, 2, '04:45:00', '04:55:00', 337, 1),
(1, 11, 3, '06:08:00', '06:10:00', 413, 1),
(1, 9, 4, '07:45:00', '07:55:00', 478, 1),
(1, 8, 5, '08:38:00', '08:40:00', 528, 1),
(1, 7, 6, '09:42:00', '09:45:00', 579, 1),
(1, 6, 7, '11:00:00', '11:05:00', 634, 1),
(1, 5, 8, '12:15:00', '12:25:00', 679, 1),
(1, 4, 9, '13:08:00', '13:10:00', 724, 1),
(1, 3, 10, '13:52:00', '13:55:00', 765, 1),
(1, 2, 11, '15:22:00', '15:25:00', 854, 1),
(1, 1, 12, '18:15:00', '18:15:00', 986, 1);

-- Seed Classes
INSERT INTO TRAIN_CLASSES (train_id, class_name, base_fare, fare_per_km, available_seats) VALUES
(1, 'Sleeper', 350.00, 0.45, 142),
(1, 'AC Compartment', 920.00, 1.15, 48),
(1, 'Second Class', 195.00, 0.25, 95),
(3, 'Chair Car', 790.00, 1.35, 180),
(3, 'Executive Chair Car', 1540.00, 2.65, 44),
(11, 'Second Class', 35.00, 0.15, 450);

-- Seed Live Status
INSERT INTO LIVE_STATUS (train_id, current_station, next_station, latitude, longitude, speed, delay_minutes, status) VALUES
(1, 'Palakkad Junction', 'Shoranur Junction', 10.786700, 76.654800, 68, 8, 'Running'),
(3, 'Kannur Main', 'Kozhikode Main', 11.874500, 75.370400, 115, 0, 'On Time'),
(5, 'Shoranur Junction', 'Palakkad Junction', 10.762100, 76.275800, 62, 5, 'Running'),
(11, 'Palakkad Junction', 'Shoranur Junction', 10.786700, 76.654800, 45, 0, 'On Time');
