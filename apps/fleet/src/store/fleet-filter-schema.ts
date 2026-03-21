import { z } from 'zod';

export const fleetFilterSchema = z.object({
  status: z.enum(['available', 'rented', 'maintenance', 'blocked', '']).default(''),
  type: z.enum(['car', 'motorcycle', 'van', '']).default(''),
  search: z.string().default(''),
});

export type FleetFilters = z.infer<typeof fleetFilterSchema>;

export const FLEET_FILTER_DEFAULTS: FleetFilters = fleetFilterSchema.parse({});
