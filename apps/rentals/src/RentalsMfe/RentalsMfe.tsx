import { useEffect } from 'react';

import type { FleetSlice, ShellApi } from '@-label-/contracts';
import { FLEET_SLICE, RENTALS_SLICE } from '@-label-/contracts';

interface Props {
  shellApi?: ShellApi;
}

const RentalsMfe = ({ shellApi }: Props) => {
  useEffect(() => {
    shellApi?.registerSlice(RENTALS_SLICE);
    return () => shellApi?.unregisterSlice(RENTALS_SLICE.name);
  }, [shellApi]);

  // Cross-MFE subscription: listen to Fleet's selected vehicle
  useEffect(() => {
    const unsub = shellApi?.onSliceChange<FleetSlice>(FLEET_SLICE.name, state => {
      if (state?.selectedVehicle) {
        // eslint-disable-next-line no-console -- Cross-MFE demo: log fleet selection events
        console.log('[Rentals] Fleet vehicle selected:', state.selectedVehicle.plate);
      }
    });
    return () => unsub?.();
  }, [shellApi]);

  return (
    <div data-testid="rentals-mfe">
      <h1>Rentals</h1>
      <p>This is the Rentals MFE loaded via Module Federation.</p>
    </div>
  );
};

export default RentalsMfe;
