import { useEffect } from 'react';

import type { ShellApi } from '@-label-/contracts';
import { MAINTENANCE_SLICE } from '@-label-/contracts';

interface Props {
  shellApi?: ShellApi;
}

const MaintenanceMfe = ({ shellApi }: Props) => {
  useEffect(() => {
    shellApi?.registerSlice(MAINTENANCE_SLICE);
    return () => shellApi?.unregisterSlice(MAINTENANCE_SLICE.name);
  }, [shellApi]);

  return (
    <div data-testid="maintenance-mfe">
      <h1>Maintenance</h1>
      <p>This is the Maintenance MFE loaded via Module Federation.</p>
    </div>
  );
};

export default MaintenanceMfe;
