export type LatLng = { lat: number; lng: number };
export type RiskLevel = "Low" | "Medium" | "High";

export type WaypointStop = {
  address: string;
  coords: LatLng | null;
  position?: LatLng;
};

export type AlternativeRoute = {
  polyline: LatLng[];
  eta_minutes: number;
  risk_level: RiskLevel;
  route_summary: string | null;
  distance_km: number | null;
  duration_minutes_base: number;
  duration_minutes_traffic: number;
};

export type RouteData = {
  polyline?: LatLng[];
  eta_minutes?: number;
  risk_level?: RiskLevel;
  advisory_text?: string;
  recommended_departure_time?: string;
  origin_label?: string;
  destination_label?: string;
  origin_position?: LatLng;
  destination_position?: LatLng;
  distance_km?: number | null;
  travel_mode?: "driving" | "bicycling" | "walking";
  waypoints?: WaypointStop[];
  routes?: AlternativeRoute[];
};

export type WeatherData = {
  temperature: number;
  feels_like: number;
  weather_code: number;
  condition: { label: string; icon: string };
  precipitation: number;
  wind_speed: number;
};

export type RecentSearch = {
  id: number;
  user_id: number;
  destination: string;
  sub_address: string;
  searched_at: string;
};

export type TripRecord = {
  id: number;
  user_id: number;
  origin_label: string;
  destination_label: string;
  eta_minutes: number | null;
  risk_level: RiskLevel;
  distance_km: number | null;
  started_at: string;
  ended_at: string | null;
};

export type ProfileData = {
  id: number;
  username: string;
  email: string;
  created_at: string;
  trip_count: number;
  search_count: number;
};

export type RiskBadge = { bg: string; text: string };

export type LocalEvent = {
  id: string;
  name: string;
  description: string;
  month: number;
  day: number;
  duration_days: number;
  category: "fiesta" | "festival" | "religious" | "civic" | "cultural" | "trade";
  traffic_impact: "low" | "medium" | "high";
  traffic_note: string;
  location: string;
  location_coords: LatLng;
  icon: string;
  is_moveable?: boolean;
  // Computed server-side:
  date_display: string;  // "January 20, 2027"
  days_away: number;
};
