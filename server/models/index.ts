import mongoose, { Schema, Document } from 'mongoose';

export type JobStage = 'New Lead' | 'Inspection Done' | 'Work In Progress' | 'Ready for Delivery' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';
export type TechnicianStatus = 'Available' | 'Busy' | 'Off';
export type InventoryCategory = 'PPF' | 'Ceramic' | 'Tools' | 'Parts' | 'Chemicals';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

export interface IVehicle {
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  color: string;
  vin?: string;
}

export type CustomerStatus = 'Inquired' | 'Working' | 'Waiting' | 'Completed';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: CustomerStatus;
  vehicles: IVehicle[];
  createdAt: Date;
}

export interface IServiceItem {
  description: string;
  cost: number;
  type: 'part' | 'labor';
}

export interface IPayment {
  amount: number;
  mode: PaymentMode;
  date: Date;
  notes?: string;
}

export interface IJob extends Document {
  customerId: mongoose.Types.ObjectId;
  vehicleIndex: number;
  customerName: string;
  vehicleName: string;
  plateNumber: string;
  stage: JobStage;
  technicianId?: mongoose.Types.ObjectId;
  technicianName?: string;
  notes: string;
  serviceItems: IServiceItem[];
  materials: { inventoryId: mongoose.Types.ObjectId; name: string; quantity: number; cost: number }[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  payments: IPayment[];
  checklist: { item: string; done: boolean }[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITechnician extends Document {
  name: string;
  specialty: string;
  phone?: string;
  status: TechnicianStatus;
  createdAt: Date;
}

export interface IInventoryItem extends Document {
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minStock: number;
  price: number;
  createdAt: Date;
}

export interface IAppointment extends Document {
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  vehicleInfo: string;
  serviceType: string;
  date: Date;
  timeSlot: string;
  notes?: string;
  status: 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Converted';
  jobId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IWhatsAppTemplate extends Document {
  stage: JobStage;
  message: string;
  isActive: boolean;
}

const VehicleSchema = new Schema<IVehicle>({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: String, required: true },
  plateNumber: { type: String, required: true },
  color: { type: String, required: true },
  vin: { type: String }
});

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  status: { type: String, enum: ['Inquired', 'Working', 'Waiting', 'Completed'], default: 'Inquired' },
  vehicles: [VehicleSchema],
  createdAt: { type: Date, default: Date.now }
});

const ServiceItemSchema = new Schema<IServiceItem>({
  description: { type: String, required: true },
  cost: { type: Number, required: true },
  type: { type: String, enum: ['part', 'labor'], required: true }
});

const PaymentSchema = new Schema<IPayment>({
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String }
});

const JobSchema = new Schema<IJob>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleIndex: { type: Number, required: true },
  customerName: { type: String, required: true },
  vehicleName: { type: String, required: true },
  plateNumber: { type: String, required: true },
  stage: { 
    type: String, 
    enum: ['New Lead', 'Inspection Done', 'Work In Progress', 'Ready for Delivery', 'Completed', 'Cancelled'],
    default: 'New Lead'
  },
  technicianId: { type: Schema.Types.ObjectId, ref: 'Technician' },
  technicianName: { type: String },
  notes: { type: String, default: '' },
  serviceItems: [ServiceItemSchema],
  materials: [{
    inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory' },
    name: String,
    quantity: Number,
    cost: Number
  }],
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Partially Paid', 'Paid'], default: 'Pending' },
  payments: [PaymentSchema],
  checklist: [{ item: String, done: Boolean }],
  images: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TechnicianSchema = new Schema<ITechnician>({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  phone: { type: String },
  status: { type: String, enum: ['Available', 'Busy', 'Off'], default: 'Available' },
  createdAt: { type: Date, default: Date.now }
});

const InventorySchema = new Schema<IInventoryItem>({
  name: { type: String, required: true },
  category: { type: String, enum: ['PPF', 'Ceramic', 'Tools', 'Parts', 'Chemicals'], required: true },
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  minStock: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const AppointmentSchema = new Schema<IAppointment>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  vehicleInfo: { type: String, required: true },
  serviceType: { type: String, required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ['Scheduled', 'Confirmed', 'Cancelled', 'Converted'], default: 'Scheduled' },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  createdAt: { type: Date, default: Date.now }
});

const WhatsAppTemplateSchema = new Schema<IWhatsAppTemplate>({
  stage: { 
    type: String, 
    enum: ['New Lead', 'Inspection Done', 'Work In Progress', 'Ready for Delivery', 'Completed', 'Cancelled'],
    required: true,
    unique: true
  },
  message: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Job = mongoose.model<IJob>('Job', JobSchema);
export const Technician = mongoose.model<ITechnician>('Technician', TechnicianSchema);
export const Inventory = mongoose.model<IInventoryItem>('Inventory', InventorySchema);
export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export const WhatsAppTemplate = mongoose.model<IWhatsAppTemplate>('WhatsAppTemplate', WhatsAppTemplateSchema);
