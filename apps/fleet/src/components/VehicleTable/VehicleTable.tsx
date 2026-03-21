import type { JSX } from 'react';

import type { Vehicle } from '@-label-/client-fleet';
import type { ColumnDef } from '@-label-/ui-internal-datatable';
import { DataTable } from '@-label-/ui-internal-datatable';

interface VehicleTableProps {
  columns: ColumnDef<Vehicle, unknown>[];
  data: Vehicle[];
}

export const VehicleTable = ({ columns, data }: VehicleTableProps): JSX.Element => <DataTable columns={columns} data={data} />;
