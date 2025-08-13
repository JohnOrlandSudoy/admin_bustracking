import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

interface LocationTrailProps {
  busNumber: string;
  locations: Array<{ lat: number; lng: number; timestamp: string }>;
  color?: string;
  weight?: number;
  opacity?: number;
}

export const LocationTrail: React.FC<LocationTrailProps> = ({
  busNumber,
  locations,
  color = '#3B82F6',
  weight = 3,
  opacity = 0.6
}) => {
  if (locations.length < 2) {
    return null;
  }

  // Convert locations to LatLngExpression format
  const positions: LatLngExpression[] = locations.map(loc => [loc.lat, loc.lng]);

  // Calculate trail age for opacity variation
  const getTrailOpacity = () => {
    if (locations.length < 10) return opacity;
    
    // Gradually reduce opacity for older parts of the trail
    const recentCount = Math.min(10, Math.floor(locations.length * 0.3));
    const recentOpacity = opacity;
    const olderOpacity = opacity * 0.3;
    
    return {
      recent: recentOpacity,
      older: olderOpacity
    };
  };

  const trailOpacity = getTrailOpacity();

  // If we have enough points, create a segmented trail with different opacities
  if (locations.length >= 10) {
    const recentCount = Math.floor(locations.length * 0.7);
    const recentPositions = positions.slice(-recentCount);
    const olderPositions = positions.slice(0, -recentCount);

    return (
      <>
        {/* Older trail segment with lower opacity */}
        {olderPositions.length >= 2 && (
          <Polyline
            positions={olderPositions}
            color={color}
            weight={weight - 1}
            opacity={trailOpacity.older}
            dashArray="5, 5"
          />
        )}
        
        {/* Recent trail segment with full opacity */}
        {recentPositions.length >= 2 && (
          <Polyline
            positions={recentPositions}
            color={color}
            weight={weight}
            opacity={trailOpacity.recent}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="text-xs">
                <div className="font-semibold text-blue-700">Bus {busNumber} Trail</div>
                <div className="text-gray-600">
                  Recent: {recentPositions.length} points
                </div>
                <div className="text-gray-500">
                  Total: {locations.length} points
                </div>
              </div>
            </Tooltip>
          </Polyline>
        )}
      </>
    );
  }

  // Simple trail for fewer points
  return (
    <Polyline
      positions={positions}
      color={color}
      weight={weight}
      opacity={opacity}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
        <div className="text-xs">
          <div className="font-semibold text-blue-700">Bus {busNumber} Trail</div>
          <div className="text-gray-600">
            {locations.length} location points
          </div>
          <div className="text-gray-500">
            {locations.length > 0 && new Date(locations[locations.length - 1].timestamp).toLocaleTimeString()}
          </div>
        </div>
      </Tooltip>
    </Polyline>
  );
};
