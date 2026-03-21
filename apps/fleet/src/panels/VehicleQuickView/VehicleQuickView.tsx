import { ExternalLink, MousePointerClick } from 'lucide-react';

import { VehicleStatusBadge } from '../../components/VehicleStatusBadge/VehicleStatusBadge';

import { useGetVehicle } from '@-label-/client-fleet';
import type { ShellApi } from '@-label-/contracts';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@-label-/ui-internal-core';

interface Props {
  shellApi?: ShellApi;
  payload?: Record<string, unknown>;
}

const VehicleQuickView = ({ shellApi, payload }: Props) => {
  const vehicleId = (payload?.id as string) ?? '';
  const { data: vehicle, isLoading, isError } = useGetVehicle(vehicleId);

  if (isLoading) return <p className="p-4">Loading...</p>;
  if (isError || !vehicle) return <p className="text-destructive p-4">Failed to load vehicle.</p>;

  return (
    <div className="space-y-4 p-4" data-testid="vehicle-quick-view">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {vehicle.brand} {vehicle.model}
            <VehicleStatusBadge status={vehicle.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Plate</p>
            <p className="font-medium">{vehicle.plate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">{vehicle.type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Year</p>
            <p className="font-medium">{vehicle.year}</p>
          </div>
          <div>
            <p className="text-muted-foreground">KM</p>
            <p className="font-medium">{vehicle.km.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            shellApi?.completeVehicleSelection({
              id: vehicle.id,
              plate: vehicle.plate,
              model: vehicle.model,
              status: vehicle.status,
            });
          }}
          size="sm"
        >
          <MousePointerClick className="mr-1 h-4 w-4" />
          Select Vehicle
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            shellApi?.navigate(`/fleet/${vehicle.id}`);
            shellApi?.closePanel();
          }}
          size="sm"
          variant="outline"
        >
          <ExternalLink className="mr-1 h-4 w-4" />
          Full Detail
        </Button>
      </div>
    </div>
  );
};

export default VehicleQuickView;
