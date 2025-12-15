import { z } from "zod";

export type JobStage = 'New Lead' | 'Inspection Done' | 'Work In Progress' | 'Ready for Delivery' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';
export type TechnicianStatus = 'Available' | 'Busy' | 'Off';
export type InventoryCategory = 'PPF' | 'Ceramic' | 'Tools' | 'Parts' | 'Chemicals';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
export type CustomerStatus = 'Inquired' | 'Working' | 'Waiting' | 'Completed';

export const CUSTOMER_STATUSES: CustomerStatus[] = ['Inquired', 'Working', 'Waiting', 'Completed'];

export const JOB_STAGES: JobStage[] = [
  'New Lead',
  'Inspection Done', 
  'Work In Progress',
  'Ready for Delivery',
  'Completed',
  'Cancelled'
];

export const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.string(),
  plateNumber: z.string().min(1),
  color: z.string().min(1),
  vin: z.string().optional()
});

export const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  status: z.enum(['Inquired', 'Working', 'Waiting', 'Completed']).default('Inquired'),
  vehicles: z.array(vehicleSchema).default([])
});

export const serviceItemSchema = z.object({
  description: z.string().min(1),
  cost: z.number().min(0),
  type: z.enum(['part', 'labor'])
});

export const paymentSchema = z.object({
  amount: z.number().min(0),
  mode: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer']),
  notes: z.string().optional()
});

export const jobSchema = z.object({
  customerId: z.string(),
  vehicleIndex: z.number().min(0),
  customerName: z.string(),
  vehicleName: z.string(),
  plateNumber: z.string(),
  stage: z.enum(['New Lead', 'Inspection Done', 'Work In Progress', 'Ready for Delivery', 'Completed', 'Cancelled']).default('New Lead'),
  technicianId: z.string().optional(),
  technicianName: z.string().optional(),
  notes: z.string().default(''),
  serviceItems: z.array(serviceItemSchema).default([]),
  totalAmount: z.number().default(0),
  paidAmount: z.number().default(0),
  paymentStatus: z.enum(['Pending', 'Partially Paid', 'Paid']).default('Pending')
});

export const technicianSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  phone: z.string().optional(),
  status: z.enum(['Available', 'Busy', 'Off']).default('Available')
});

export const inventorySchema = z.object({
  name: z.string().min(1),
  category: z.enum(['PPF', 'Ceramic', 'Tools', 'Parts', 'Chemicals']),
  quantity: z.number().min(0).default(0),
  unit: z.string().min(1),
  minStock: z.number().min(0).default(0),
  price: z.number().min(0).default(0)
});

export const appointmentSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  vehicleInfo: z.string().min(1),
  serviceType: z.string().min(1),
  date: z.string(),
  timeSlot: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(['Scheduled', 'Confirmed', 'Cancelled', 'Converted']).default('Scheduled')
});

export type Vehicle = z.infer<typeof vehicleSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Job = z.infer<typeof jobSchema>;
export type Technician = z.infer<typeof technicianSchema>;
export type InventoryItem = z.infer<typeof inventorySchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
