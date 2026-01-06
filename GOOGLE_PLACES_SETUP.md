# Google Places API Integration

## Overview

The new project form now includes **Google Places Autocomplete** to streamline property data entry. As you type an address, Google will suggest real addresses and automatically fill in:
- Street address
- City
- State (2-letter abbreviation)
- ZIP code

## Setup

### 1. Get a Google Places API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** (New)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Restrict the API key (recommended):
   - **Application restrictions**: HTTP referrers
   - Add your domains: `localhost:*`, `*.vercel.app`, your production domain
   - **API restrictions**: Restrict key to "Places API (New)"

### 2. Add API Key to Environment Variables

Add your API key to `.env`:

```bash
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Important**: The `NEXT_PUBLIC_` prefix is required for Next.js to expose this variable to the browser.

### 3. Restart Development Server

After adding the environment variable:

```bash
npm run dev
```

## Usage

### In the New Project Form

1. Navigate to `/projects/new`
2. Start typing in the **Street Address** field
3. Select an address from the autocomplete dropdown
4. City, State, and ZIP will be automatically filled

### Manual Entry

If autocomplete doesn't work or you prefer manual entry:
- You can still type and edit all fields manually
- Autocomplete is a convenience feature, not required

## Implementation Details

### Files Modified

- **`src/hooks/use-places-autocomplete.ts`** (NEW)
  - Custom React hook that initializes Google Places Autocomplete
  - Parses address components from Google's response
  - Calls callback with structured address data

- **`src/app/projects/new/page.tsx`** (UPDATED)
  - Added `addressInputRef` to attach autocomplete to input
  - Uses `usePlacesAutocomplete` hook
  - Auto-fills form fields when address is selected

### Dependencies

No additional dependencies required! The hook loads the Google Maps JavaScript API directly via a `<script>` tag.

## Troubleshooting

### Autocomplete not working

1. **Check API key**: Make sure `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set in `.env`
2. **Check console**: Open browser DevTools → Console tab for errors
3. **Billing enabled**: Google Places API requires billing to be enabled on your Google Cloud project
4. **API enabled**: Verify "Places API (New)" is enabled in Google Cloud Console

### Address not parsing correctly

The hook extracts these address components:
- `street_number`: House/building number
- `route`: Street name
- `locality`: City
- `administrative_area_level_1`: State
- `postal_code`: ZIP code

If an address component is missing, that field will remain empty.

### Country restriction

Currently restricted to US addresses only (`componentRestrictions: { country: 'us' }`).

To change this, edit `src/hooks/use-places-autocomplete.ts`:

```typescript
autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
  types: ['address'],
  componentRestrictions: { country: ['us', 'ca'] }, // Add Canada
  fields: ['address_components', 'formatted_address'],
});
```

## Cost

- Google Places Autocomplete: **$2.83 per 1,000 requests**
- This is billed when a user selects an address from the dropdown
- Typing in the field without selecting is free
- See [Google Maps Pricing](https://developers.google.com/maps/billing-and-pricing/pricing#places) for details

## Security

### API Key Restrictions (Recommended)

1. **Application restrictions**: Limit to specific websites
   - Development: `localhost:*`
   - Production: `yourdomain.com`, `*.vercel.app`

2. **API restrictions**: Only allow "Places API (New)"

3. **Usage quotas**: Set daily quotas to prevent abuse

### Rate Limiting

The Google Places API has usage limits:
- 1,000 requests per day (free tier)
- After that, billing applies

Monitor usage in Google Cloud Console → APIs & Services → Dashboard

## Future Enhancements

Potential improvements:
- **Place Details API**: Fetch additional property data (lat/lng, neighborhood, etc.)
- **Geocoding**: Get coordinates for mapping features
- **Property type detection**: Automatically detect SFH vs multi-family
- **Historical data**: Pull property records if available
