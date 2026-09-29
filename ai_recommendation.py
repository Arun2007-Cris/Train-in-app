"""
TRAIN IN APP — Explainable AI Recommendation Engine
College Project Module

Evaluates available trains based on:
1. Departure Time proximity
2. Journey Duration (Travel speed)
3. Train Fare / Charges
4. Number of Intermediate Halts (Directness)
5. Train Type (Vande Bharat, Tejas, Superfast, Express, MEMU)
6. Running Status / Delay minutes (Punctuality)
7. User Preferences (Cheapest, Fastest, Earliest departure, Best overall, Comfortable journey)
"""

from typing import Dict, List, Any, Tuple


def time_to_minutes(time_str: str) -> int:
    """Convert 'HH:MM' to minutes past midnight."""
    if not time_str:
        return 0
    parts = time_str.split(':')
    return int(parts[0]) * 60 + int(parts[1])


def format_duration(minutes: int) -> str:
    """Format minutes to readable 'Xh Ym'."""
    h = minutes // 60
    m = minutes % 60
    if h == 0:
        return f"{m}m"
    if m == 0:
        return f"{h}h"
    return f"{h}h {m}m"


def compute_ai_score_and_reason(
    train: Dict[str, Any],
    duration_minutes: int,
    base_fare: float,
    stop_count: int,
    dep_time: str,
    query_time: str,
    preference: str = "Best overall"
) -> Tuple[int, str, List[str]]:
    """
    Explainable Multi-Criteria AI Recommendation Engine.
    Returns: (ai_score_0_100, explainable_reason_text, list_of_matching_tags)
    """
    matches = []

    # 1. Normalized Speed Score (30 - 100)
    speed_score = max(30, min(100, int(110 - (duration_minutes / 60.0) * 8)))

    # 2. Normalized Fare Score (30 - 100)
    fare_score = max(30, min(100, int(105 - (base_fare / 25.0))))

    # 3. Punctuality Score based on simulated delay
    delay = train.get("delay_minutes", 0)
    if delay <= 0:
        punctuality_score = 100
    elif delay <= 15:
        punctuality_score = 88
    elif delay <= 30:
        punctuality_score = 70
    else:
        punctuality_score = 50

    # 4. Directness Score (fewer intermediate halts)
    directness_score = max(40, min(100, 100 - (stop_count * 6)))

    # 5. Comfort rating by Train Type
    train_type = train.get("train_type", "Express")
    comfort_map = {
        "Vande Bharat": 99,
        "Tejas": 96,
        "Rajdhani": 96,
        "Humsafar": 90,
        "Superfast": 84,
        "Jan Shatabdi": 82,
        "Express": 78,
        "MEMU": 65,
    }
    comfort_score = comfort_map.get(train_type, 75)

    # 6. Departure Proximity
    q_mins = time_to_minutes(query_time)
    d_mins = time_to_minutes(dep_time)
    time_diff = d_mins - q_mins
    if time_diff < 0:
        time_diff += 1440
    proximity_score = max(30, min(100, int(100 - (time_diff / 30.0))))

    # Weighted scoring based on user choice
    if preference == "Cheapest":
        final_score = int(
            fare_score * 0.55 +
            speed_score * 0.15 +
            directness_score * 0.15 +
            punctuality_score * 0.15
        )
        matches.append("Affordable Fare")
        reason = f"Best budget efficiency: Starts at only ₹{int(base_fare)} with solid reliability ({punctuality_score}% punctuality)."

    elif preference == "Fastest":
        final_score = int(
            speed_score * 0.55 +
            directness_score * 0.20 +
            punctuality_score * 0.15 +
            comfort_score * 0.10
        )
        matches.append("Rapid Transit")
        reason = f"Shortest travel time ({format_duration(duration_minutes)}) with only {stop_count} intermediate halts and high speed."

    elif preference == "Earliest departure":
        final_score = int(
            proximity_score * 0.55 +
            speed_score * 0.20 +
            punctuality_score * 0.15 +
            directness_score * 0.10
        )
        matches.append("Earliest Boarding")
        reason = f"Departs earliest at {dep_time}, minimizing your waiting duration at the station."

    elif preference == "Comfortable journey":
        final_score = int(
            comfort_score * 0.50 +
            punctuality_score * 0.25 +
            directness_score * 0.15 +
            speed_score * 0.10
        )
        matches.append("High Comfort")
        if train_type in ["Vande Bharat", "Tejas", "Rajdhani"]:
            matches.append("Luxury Class")
        reason = f"Superior onboard ergonomics: {train_type} rakes, modern climate control and serene ride quality."

    else:  # Best overall
        final_score = int(
            speed_score * 0.25 +
            fare_score * 0.22 +
            comfort_score * 0.20 +
            punctuality_score * 0.18 +
            directness_score * 0.15
        )
        matches.append("Balanced Choice")
        status_text = "Right on time" if delay == 0 else f"{delay}m delay"
        reason = f"Optimal balance of travel time ({format_duration(duration_minutes)}), value (from ₹{int(base_fare)}), and performance ({status_text})."

    final_score = max(62, min(99, final_score))
    return final_score, reason, matches
