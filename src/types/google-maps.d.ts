// Google Maps JavaScript API type definitions
// This provides basic types for the Places Autocomplete API

declare namespace google {
  namespace maps {
    namespace places {
      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }

      interface PlaceResult {
        address_components?: AddressComponent[];
        formatted_address?: string;
      }

      interface AutocompleteOptions {
        types?: string[];
        componentRestrictions?: {
          country: string | string[];
        };
        fields?: string[];
      }

      class Autocomplete {
        constructor(input: HTMLInputElement, options?: AutocompleteOptions);
        addListener(event: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }
    }

    namespace event {
      function clearInstanceListeners(instance: any): void;
    }
  }
}

interface Window {
  google?: typeof google;
}
