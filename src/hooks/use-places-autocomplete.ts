'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PlaceResult {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface UsePlacesAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function usePlacesAutocomplete({ onPlaceSelected, inputRef }: UsePlacesAutocompleteProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isLoadedRef = useRef(false);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address'],
    });

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place || !place.address_components) return;

      // Parse address components
      let streetNumber = '';
      let route = '';
      let city = '';
      let state = '';
      let zip = '';

      place.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        if (types.includes('route')) {
          route = component.short_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
        if (types.includes('postal_code')) {
          zip = component.long_name;
        }
      });

      const address = `${streetNumber} ${route}`.trim();

      onPlaceSelected({
        address,
        city,
        state,
        zip,
      });
    });
  }, [inputRef, onPlaceSelected]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.warn('Google Places API key not found. Set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY in .env');
      return;
    }

    if (!inputRef.current) return;

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
      return;
    }

    // Check if script is already being loaded
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;

    // Load Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      initAutocomplete();
    };

    script.onerror = () => {
      console.error('Error loading Google Maps API');
      isLoadedRef.current = false;
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup autocomplete listeners
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [inputRef, initAutocomplete]);
}
