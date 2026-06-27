import { Client, GeocodeRequest, DistanceMatrixRequest, TravelMode, UnitSystem } from '@googlemaps/google-maps-services-js';
import { config } from '../config';

const mapsClient = new Client({});

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressComponents {
  building: string;
  floor?: string;
  roomNumber: string;
  landmark?: string;
}

export interface GeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
  placeId: string;
}

export interface DistanceMatrixResult {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  status: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const request: GeocodeRequest = {
    params: {
      address,
      key: config.googleMapsApiKey,
      region: 'in',
    },
  };

  const response = await mapsClient.geocode(request);
  
  if (response.data.status !== 'OK' || response.data.results.length === 0) {
    throw new Error(`Geocoding failed: ${response.data.status}`);
  }

  const result = response.data.results[0];
  return {
    coordinates: {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
    },
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const request: any = {
    params: {
      latlng: `${lat},${lng}`,
      key: config.googleMapsApiKey,
      region: 'in',
    },
  };

  const response = await mapsClient.geocode(request);
  
  if (response.data.status !== 'OK' || response.data.results.length === 0) {
    throw new Error(`Reverse geocoding failed: ${response.data.status}`);
  }

  const result = response.data.results[0];
  return {
    coordinates: { lat, lng },
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
  };
}

export async function getDistanceMatrix(
  origins: Coordinates[],
  destinations: Coordinates[],
  mode: 'walking' | 'driving' | 'bicycling' = 'walking'
): Promise<DistanceMatrixResult[][]> {
  const request: DistanceMatrixRequest = {
    params: {
      origins: origins.map(o => `${o.lat},${o.lng}`),
      destinations: destinations.map(d => `${d.lat},${d.lng}`),
      mode: mode as TravelMode,
      key: config.googleMapsApiKey,
      units: UnitSystem.metric,
    },
  };

  const response = await mapsClient.distancematrix(request);
  
  if (response.data.status !== 'OK') {
    throw new Error(`Distance matrix failed: ${response.data.status}`);
  }

  return response.data.rows.map(row => 
    row.elements.map(element => ({
      distance: element.distance,
      duration: element.duration,
      status: element.status,
    }))
  );
}

export async function getDistanceAndDuration(
  origin: Coordinates,
  destination: Coordinates,
  mode: 'walking' | 'driving' | 'bicycling' = 'walking'
): Promise<DistanceMatrixResult> {
  const results = await getDistanceMatrix([origin], [destination], mode);
  return results[0][0];
}

export function formatAddress(components: AddressComponents): string {
  const parts = [components.building];
  if (components.floor) parts.push(`Floor ${components.floor}`);
  parts.push(`Room ${components.roomNumber}`);
  if (components.landmark) parts.push(`Near ${components.landmark}`);
  return parts.join(', ');
}

export function calculateDeliveryFee(distanceMeters: number): number {
  const baseFee = config.restaurant.defaultDeliveryFee;
  const perKm = 5;
  const km = distanceMeters / 1000;
  return Math.round(baseFee + km * perKm);
}

export function estimateDeliveryTime(durationSeconds: number, prepTimeMinutes: number): number {
  const travelTimeMinutes = Math.ceil(durationSeconds / 60);
  const buffer = 5; // minutes
  return travelTimeMinutes + prepTimeMinutes + buffer;
}