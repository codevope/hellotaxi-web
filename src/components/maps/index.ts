// Maps components barrel export
export { default as GoogleMapsProvider } from './google-maps-provider';
export { default as PlaceAutocomplete } from './place-autocomplete';
export { default as InteractiveMap } from './interactive-map';
export { default as LocationPicker } from './location-picker';
export { default as RouteDisplay } from './route-display';
export { default as MapMarker } from './map-marker';
export { default as MapView } from './map-view';

// Types
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export type MarkerType = 'user' | 'pickup' | 'dropoff' | 'driver' | 'custom';
