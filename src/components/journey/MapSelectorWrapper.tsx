'use client';

import dynamic from 'next/dynamic';

// Dynamically import MapSelector with no SSR (Leaflet requires window)
const MapSelector = dynamic(
  () => import('./MapSelector'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[50vh] sm:h-[55vh] md:h-[500px] min-h-[300px] bg-muted/30 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default MapSelector;
