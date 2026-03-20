import { useEffect } from 'react';

import type { ShellApi } from '@-label-/contracts';
import { FLEET_SLICE } from '@-label-/contracts';

interface Props {
  shellApi?: ShellApi;
}

const FleetMfe = ({ shellApi }: Props) => {
  useEffect(() => {
    shellApi?.registerSlice(FLEET_SLICE);
    return () => shellApi?.unregisterSlice(FLEET_SLICE.name);
  }, [shellApi]);

  return (
    <div data-testid="fleet-mfe">
      <h1>Hello from Fleet</h1>
      <p>This is the Fleet MFE loaded via Module Federation.</p>
    </div>
  );
};

export default FleetMfe;
