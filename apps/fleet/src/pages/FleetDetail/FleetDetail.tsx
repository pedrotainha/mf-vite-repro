import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, CheckCircle, Wrench } from 'lucide-react';

import { VehicleStatusBadge } from '../../components/VehicleStatusBadge/VehicleStatusBadge';

import { getListVehiclesQueryKey, useGetVehicle, usePatchVehicle } from '@-label-/client-fleet';
import type { ShellApi, VehicleStatus } from '@-label-/contracts';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@-label-/ui-internal-core';

interface Props {
  shellApi?: ShellApi;
}

const FleetDetail = ({ shellApi }: Props) => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const queryClient = useQueryClient();
  const { data: vehicle, isLoading, isError } = useGetVehicle(vehicleId ?? '');
  const { mutate: patchVehicle, isPending } = usePatchVehicle({
    mutation: {
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
        if (vehicleId) {
          void queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}`] });
        }
      },
    },
  });

  const handleStatusChange = useMemo(
    () => (status: VehicleStatus, label: string) => {
      if (!vehicleId) return;
      patchVehicle(
        { id: vehicleId, data: { status } },
        {
          onSuccess: () => toast.success(`Vehicle ${label.toLowerCase()} successfully`),
          onError: () => toast.error(`Failed to ${label.toLowerCase()} vehicle`),
        },
      );
    },
    [vehicleId, patchVehicle],
  );

  if (isLoading) return <p>Loading vehicle details...</p>;
  if (isError || !vehicle) return <p className="text-destructive">Failed to load vehicle details.</p>;

  return (
    <div className="space-y-4" data-testid="fleet-detail">
      <div className="flex items-center gap-4">
        <Button onClick={() => shellApi?.navigate('/fleet')} size="sm" variant="ghost">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Fleet
        </Button>
        <h1 className="text-2xl font-bold">
          {vehicle.brand} {vehicle.model} — {vehicle.plate}
        </h1>
        <VehicleStatusBadge status={vehicle.status} />
      </div>

      <div className="flex gap-2">
        <ConfirmDialog
          confirmLabel="Block"
          description="This will mark the vehicle as blocked. It will not be available for rentals."
          onConfirm={() => handleStatusChange('blocked', 'Blocked')}
          title="Block vehicle?"
          trigger={
            <Button disabled={isPending || vehicle.status === 'blocked'} size="sm" variant="destructive">
              <Ban className="mr-1 h-4 w-4" />
              Block
            </Button>
          }
          variant="destructive"
        />
        <ConfirmDialog
          confirmLabel="Unblock"
          description="This will mark the vehicle as available again."
          onConfirm={() => handleStatusChange('available', 'Unblocked')}
          title="Unblock vehicle?"
          trigger={
            <Button disabled={isPending || vehicle.status === 'available'} size="sm">
              <CheckCircle className="mr-1 h-4 w-4" />
              Unblock
            </Button>
          }
        />
        <ConfirmDialog
          confirmLabel="Send to maintenance"
          description="This will mark the vehicle for maintenance."
          onConfirm={() => handleStatusChange('maintenance', 'Sent to maintenance')}
          title="Mark for maintenance?"
          trigger={
            <Button disabled={isPending || vehicle.status === 'maintenance'} size="sm" variant="outline">
              <Wrench className="mr-1 h-4 w-4" />
              Maintenance
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Plate</p>
                <p className="font-medium">{vehicle.plate}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Brand / Model</p>
                <p className="font-medium">
                  {vehicle.brand} {vehicle.model}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Type</p>
                <p className="font-medium">{vehicle.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Year</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Kilometers</p>
                <p className="font-medium">{vehicle.km.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Last Service</p>
                <p className="font-medium">{vehicle.lastServiceDate}</p>
              </div>
              {vehicle.notes ? (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p className="font-medium">{vehicle.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No history available yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetDetail;
