import type { JSX } from 'react';

import type { VehicleStatus } from '@-label-/client-fleet';
import { Badge } from '@-label-/ui-internal-core';

const statusConfig: Record<VehicleStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Available', variant: 'default' },
  rented: { label: 'Rented', variant: 'secondary' },
  maintenance: { label: 'Maintenance', variant: 'outline' },
  blocked: { label: 'Blocked', variant: 'destructive' },
};

export const VehicleStatusBadge = ({ status }: { status: VehicleStatus }): JSX.Element => {
  const { label, variant } = statusConfig[status] ?? statusConfig.available;
  return <Badge variant={variant}>{label}</Badge>;
};
