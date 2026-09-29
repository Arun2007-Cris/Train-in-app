# 🚆 TRAIN IN APP — AI-Powered Train Search, Recommendation, Live Location & Booking System

A full-stack railway information and booking system designed as an advanced college project. It integrates station-aware availability algorithms, multi-criteria explainable AI recommendations, live train tracking (horizontal preview & detailed vertical route tracker), dynamic travel class pricing, and simulated train-approaching notifications.

---

## 🌟 Key Features

1. **Station-Aware Train Availability Logic**:
   - Validates that the selected boarding station is an actual stop on the train's itinerary.
   - Ensures destination occurs downstream in the correct route direction.
   - Detects whether a train has already departed based on user's target date & time.
   - Accurately computes overnight journeys and timings crossing midnight.
   - Clearly flags: *"Train Not Available Here"* or *"Train Not Available"*.

2. **Explainable AI Recommendation Engine**:
   - Multi-criteria decision engine evaluating duration, base fare, halt frequency, train type (Vande Bharat, Tejas, Rajdhani, Superfast, Express, MEMU), and on-time punctuality.
   - User preferences: **Cheapest**, **Fastest**, **Earliest departure**, **Best overall**, **Comfortable journey**.
   - Generates an **AI Score (0–100)** and a human-readable **AI Reason**.

3. **Horizontal & Vertical Live Location Trackers**:
   - **Horizontal Compact Preview**: Rendered right inside each train card (`Mangaluru ── ● ── ● 🚆 ── ● ── ● ── Shoranur`).
   - **Detailed Vertical Live Route**: Shows passed stations (`✓ Passed`), active train position (`🚆 CURRENT LOCATION`), speed (km/h), delay status, and upcoming stops.
   - Labeled clearly: *Demo / Simulated Live Status*.

4. **Dynamic Travel Classes & Fare Calculation**:
   - Displays only classes applicable to that specific train (e.g. Chair Car / Executive Chair Car on Vande Bharat; Sleeper / AC / 2S on Express; Second Class on MEMU).
   - Distance-pro-rated base fares and totals with *Demo/Project Fare* label.

5. **Demo Booking & PNR Generation**:
   - Generates authentic demo PNRs (e.g. `TI48271936`) with coach & berth assignment.
   - Displays printable Demo E-Ticket with masked Aadhaar (`XXXX-XXXX-1234`).

6. **Train-Approaching Notifications**:
   - Simulated push alerts:
     - 🔔 *"Your train is approaching Shoranur. Please be ready to board."*
     - 🔔 *"Your train has arrived at Shoranur."*
     - 🔔 *"Your destination is approaching. Please prepare to get down."*
   - Interactive live route scrubber to step movement and trigger alerts.

---

## 🗄️ Database Architecture (MySQL)

- `USERS`: User credentials & profile
- `PASSENGERS`: Passenger details with Aadhaar storage
- `STATIONS`: Railway junctions (MAQ, CAN, CLT, SRR, PGT, CBE, ED, TPJ, ERS, TVC, MS, etc.)
- `TRAINS`: Train metadata & category
- `TRAIN_STOPS`: Route schedule, arrival/departure, day offset, distance
- `TRAIN_CLASSES`: Applicable coaches and fares per train
- `LIVE_STATUS`: Simulated GPS coordinates, speed, delay, progress
- `BOOKINGS`: PNR reservations, coach/berth, fares, status

Schema file: `database/train_in_app.sql`

---

## 🚀 Running the Project

### Web Application (Interactive Full-Stack Node/Express + React):
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Python / Flask Prototype:
```bash
pip install -r requirements.txt
python app.py
```
Open [http://localhost:5000](http://localhost:5000)
