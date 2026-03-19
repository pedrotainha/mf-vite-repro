/** Vehicle operational status */
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'blocked';

/** Vehicle category */
export type VehicleType = 'car' | 'motorcycle' | 'van';

/** Rental lifecycle status */
export type RentalStatus = 'pending' | 'active' | 'completed' | 'cancelled';

/** Work order lifecycle status */
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed';

/** Work order category */
export type WorkOrderType = 'preventive' | 'corrective' | 'inspection';

/** Minimal vehicle reference used across domain boundaries */
export interface VehicleRef {
  id: string;
  plate: string;
  model: string;
  status: VehicleStatus;
}
