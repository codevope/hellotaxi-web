
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, X, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Location } from '.';
import { Button } from '../ui/button';


interface PlaceAutocompleteProps {
  onPlaceSelect: (place: Location) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  isPickup?: boolean;
}

const PlaceAutocomplete = ({
  onPlaceSelect,
  placeholder = 'Buscar una dirección...',
  className,
  defaultValue = '',
  isPickup = false,
}: PlaceAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const places = useMapsLibrary('places');
  const geocoding = useMapsLibrary('geocoding');
  const geocoder = useRef<google.maps.Geocoder | null>(null);


  useEffect(() => {
    if (!geocoding) return;

    if (!geocoder.current) {
      geocoder.current = new geocoding.Geocoder();
    }
  }, [geocoding]);

  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);


  const fetchSuggestions = useCallback(async (input: string) => {
    if (!places || input.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    
    try {
      // Nueva API: AutocompleteSuggestion.fetchAutocompleteSuggestions
      const request: google.maps.places.FetchAutocompleteSuggestionsRequest = {
        input,
        includedRegionCodes: ['pe'], // Restringir a Perú
        language: 'es',
      };
      
      const { suggestions: autocompleteSuggestions } = 
        await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      
      setSuggestions(autocompleteSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [places]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    fetchSuggestions(value);
  };
  
  const handleSelect = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!suggestion.placePrediction) return;
    
    const placePrediction = suggestion.placePrediction;
    setInputValue(placePrediction.text.toString());
    setShowSuggestions(false);

    // Usar Geocoder para obtener las coordenadas del placeId
    if (!geocoder.current || !placePrediction.placeId) {
      console.error('Geocoder not initialized or missing placeId');
      return;
    }

    geocoder.current.geocode({ placeId: placePrediction.placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const place = results[0];
        const location = place.geometry?.location;
        if (location) {
          onPlaceSelect({
            lat: location.lat(),
            lng: location.lng(),
            address: place.formatted_address || placePrediction.text.toString(),
          });
        }
      } else {
        console.error('Geocoding failed:', status);
      }
    });
  };
  
  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };


  return (
    <div className={cn("relative w-full", className)}>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
        <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => { if(inputValue) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="pl-10 pr-10 text-sm"
        />
        {inputValue && (
          <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" onClick={clearInput}>
            <X className="h-4 w-4" />
          </Button>
        )}

        {showSuggestions && (
            <div className="absolute z-50 w-full bg-card border rounded-md shadow-lg mt-1">
                {loading ? (
                    <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
                    </div>
                ) : (
                    <ul className="py-1">
                        {suggestions.map((s, index) => (
                            <li
                                key={s.placePrediction?.placeId || `suggestion-${index}`}
                                className="px-4 py-2 text-sm hover:bg-accent cursor-pointer"
                                onMouseDown={() => handleSelect(s)} // Use onMouseDown to prevent blur event from firing first
                            >
                                {s.placePrediction?.text.toString()}
                            </li>
                        ))}
                         {suggestions.length === 0 && inputValue.length > 2 && (
                            <li className="px-4 py-2 text-sm text-muted-foreground">No se encontraron sugerencias.</li>
                         )}
                    </ul>
                )}
            </div>
        )}
    </div>
  );
};

export default PlaceAutocomplete;
