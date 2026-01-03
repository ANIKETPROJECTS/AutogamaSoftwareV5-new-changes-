import { z } from "zod";

export type JobStage = 'New Lead' | 'Inspection Done' | 'Work In Progress' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';
export type TechnicianStatus = 'Available' | 'Busy' | 'Off';
export type InventoryCategory = 'Elite' | 'Garware Plus' | 'Garware Premium' | 'Garware Matt' | 'Accessories';
export type CustomerStatus = 'Inquired' | 'Working' | 'Waiting' | 'Completed' | 'Cancelled';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque' | 'Other';

export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'];
export const CUSTOMER_STATUSES: CustomerStatus[] = ['Inquired', 'Working', 'Waiting', 'Completed', 'Cancelled'];

export const JOB_STAGES: JobStage[] = [
  'New Lead',
  'Inspection Done', 
  'Work In Progress',
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
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(['Inquired', 'Working', 'Waiting', 'Completed', 'Cancelled']).optional(),
  createdAt: z.date().optional(),
  vehicles: z.array(vehicleSchema).default([]),
  referrerName: z.string().optional(),
  referrerPhone: z.string().optional()
});

export const serviceItemSchema = z.object({
  description: z.string().min(1),
  cost: z.number().min(0),
  type: z.enum(['part', 'labor']),
  assignedBusiness: z.enum(['Auto Gamma', 'Business 2']).default('Auto Gamma')
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
  stage: z.enum(['New Lead', 'Inspection Done', 'Work In Progress', 'Completed', 'Cancelled']).default('New Lead'),
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

export const rollSchema = z.object({
  name: z.string().min(1).default('Unnamed Roll'),
  meters: z.number().min(0),
  squareFeet: z.number().min(0),
  remaining_meters: z.number().min(0),
  remaining_sqft: z.number().min(0),
  status: z.enum(['Available', 'Finished']).default('Available'),
  createdAt: z.date().optional()
});

export const inventorySchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().min(0).default(0),
  unit: z.string().min(1),
  minStock: z.number().min(0).default(0),
  rolls: z.array(rollSchema).default([]),
  finishedRolls: z.array(rollSchema).default([]),
  price: z.number().optional()
});
