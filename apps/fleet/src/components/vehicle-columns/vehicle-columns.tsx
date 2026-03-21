import { Eye } from 'lucide-react';

import { VehicleStatusBadge } from '../VehicleStatusBadge/VehicleStatusBadge';

import type { Vehicle, VehicleStatus } from '@-label-/client-fleet';
import type { ShellApi } from '@-label-/contracts';
import { Button } from '@-label-/ui-internal-core';
import type { ColumnDef } from '@-label-/ui-internal-datatable';

export const createVehicleColumns = (shellApi?: ShellApi): ColumnDef<Vehicle, unknown>[] => [
  {
    accessorKey: 'plate',
    header: 'Plate',
  },
  {
    accessorKey: 'brand',
    header: 'Brand',
  },
  {
    accessorKey: 'model',
    header: 'Model',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
  },
  {
    accessorKey: 'year',
    header: 'Year',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <VehicleStatusBadge status={getValue<VehicleStatus>()} />,
  },
  {
    accessorKey: 'km',
    header: 'KM',
    cell: ({ getValue }) => getValue<number>().toLocaleString(),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button
        aria-label={`Quick view ${row.original.plate}`}
        onClick={() => {
          shellApi?.openPanel({
            panelId: 'vehicle.quickView',
            payload: { id: row.original.id },
          });
        }}
        size="icon"
        variant="ghost"
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
];
