import type { JSX } from 'react';
import { X } from 'lucide-react';

import type { FleetFilters } from '../../store/fleet-filter-schema';

import { Button, Input, NativeSelect, NativeSelectOption } from '@-label-/ui-internal-core';

interface VehicleFiltersProps {
  filters: FleetFilters;
  onStatusChange: (status: FleetFilters['status']) => void;
  onTypeChange: (type: FleetFilters['type']) => void;
  onSearchChange: (search: string) => void;
  onClear: () => void;
}

export const VehicleFilters = ({ filters, onClear, onSearchChange, onStatusChange, onTypeChange }: VehicleFiltersProps): JSX.Element => {
  const hasFilters = filters.status !== '' || filters.type !== '' || filters.search !== '';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        aria-label="Search vehicles"
        className="w-64"
        onChange={event => onSearchChange(event.target.value)}
        placeholder="Search by plate, model or brand..."
        type="search"
        value={filters.search}
      />

      <NativeSelect
        aria-label="Filter by status"
        onChange={event => onStatusChange(event.target.value as FleetFilters['status'])}
        value={filters.status}
      >
        <NativeSelectOption value="">All statuses</NativeSelectOption>
        <NativeSelectOption value="available">Available</NativeSelectOption>
        <NativeSelectOption value="rented">Rented</NativeSelectOption>
        <NativeSelectOption value="maintenance">Maintenance</NativeSelectOption>
        <NativeSelectOption value="blocked">Blocked</NativeSelectOption>
      </NativeSelect>

      <NativeSelect
        aria-label="Filter by type"
        onChange={event => onTypeChange(event.target.value as FleetFilters['type'])}
        value={filters.type}
      >
        <NativeSelectOption value="">All types</NativeSelectOption>
        <NativeSelectOption value="car">Car</NativeSelectOption>
        <NativeSelectOption value="motorcycle">Motorcycle</NativeSelectOption>
        <NativeSelectOption value="van">Van</NativeSelectOption>
      </NativeSelect>

      {hasFilters ? (
        <Button aria-label="Clear filters" onClick={onClear} size="sm" variant="ghost">
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      ) : null}
    </div>
  );
};
