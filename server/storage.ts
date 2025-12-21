import { Customer, Job, Technician, Inventory, Appointment, WhatsAppTemplate, Invoice } from './models';
import type { ICustomer, IJob, ITechnician, IInventoryItem, IAppointment, IWhatsAppTemplate, IInvoice, JobStage } from './models';
import mongoose from 'mongoose';

export interface IStorage {
  getCustomers(): Promise<ICustomer[]>;
  getCustomer(id: string): Promise<ICustomer | null>;
  searchCustomers(query: string): Promise<ICustomer[]>;
  createCustomer(data: Partial<ICustomer>): Promise<ICustomer>;
  updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer | null>;
  addVehicleToCustomer(customerId: string, vehicle: any): Promise<ICustomer | null>;
  
  getJobs(): Promise<IJob[]>;
  getJob(id: string): Promise<IJob | null>;
  getJobsByCustomer(customerId: string): Promise<IJob[]>;
  getJobsByStage(stage: JobStage): Promise<IJob[]>;
  getLastJobForVehicle(customerId: string, vehicleIndex: number): Promise<IJob | null>;
  getVehicleServicePreferences(customerId: string, vehicleIndex: number): Promise<any | null>;
  updateVehiclePreferences(customerId: string, vehicleIndex: number, preferences: any): Promise<ICustomer | null>;
  createJob(data: Partial<IJob>): Promise<IJob>;
  updateJob(id: string, data: Partial<IJob>): Promise<IJob | null>;
  updateJobStage(id: string, stage: JobStage): Promise<IJob | null>;
  
  getTechnicians(): Promise<ITechnician[]>;
  getTechnician(id: string): Promise<ITechnician | null>;
  createTechnician(data: Partial<ITechnician>): Promise<ITechnician>;
  updateTechnician(id: string, data: Partial<ITechnician>): Promise<ITechnician | null>;
  getTechnicianWorkload(): Promise<{ technician: ITechnician; jobCount: number }[]>;
  
  getInventory(): Promise<IInventoryItem[]>;
  getInventoryItem(id: string): Promise<IInventoryItem | null>;
  createInventoryItem(data: Partial<IInventoryItem>): Promise<IInventoryItem>;
  updateInventoryItem(id: string, data: Partial<IInventoryItem>): Promise<IInventoryItem | null>;
  adjustInventory(id: string, quantity: number): Promise<IInventoryItem | null>;
  getLowStockItems(): Promise<IInventoryItem[]>;
  
  getAppointments(): Promise<IAppointment[]>;
  getAppointmentsByDate(date: Date): Promise<IAppointment[]>;
  createAppointment(data: Partial<IAppointment>): Promise<IAppointment>;
  updateAppointment(id: string, data: Partial<IAppointment>): Promise<IAppointment | null>;
  convertAppointmentToJob(appointmentId: string): Promise<IJob | null>;
  
  getWhatsAppTemplates(): Promise<IWhatsAppTemplate[]>;
  updateWhatsAppTemplate(stage: JobStage, message: string, isActive: boolean): Promise<IWhatsAppTemplate | null>;
  
  getInvoices(): Promise<IInvoice[]>;
  getInvoice(id: string): Promise<IInvoice | null>;
  getInvoiceByJob(jobId: string): Promise<IInvoice | null>;
  createInvoice(data: Partial<IInvoice>): Promise<IInvoice>;
  generateInvoiceForJob(jobId: string, taxRate?: number, discount?: number): Promise<IInvoice | null>;
  
  getDashboardStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    pendingPayments: number;
    totalRevenue: number;
    jobsByStage: { stage: string; count: number }[];
  }>;
}

export class MongoStorage implements IStorage {
  async getCustomers(): Promise<ICustomer[]> {
    return Customer.find().sort({ createdAt: -1 });
  }

  async getCustomer(id: string): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findById(id);
  }

  async searchCustomers(query: string): Promise<ICustomer[]> {
    const regex = new RegExp(query, 'i');
    return Customer.find({
      $or: [
        { name: regex },
        { phone: regex },
        { 'vehicles.plateNumber': regex }
      ]
    });
  }

  async createCustomer(data: Partial<ICustomer>): Promise<ICustomer> {
    const count = await Customer.countDocuments();
    const customerId = `cus${String(count + 1).padStart(3, '0')}`;
    const customer = new Customer({ ...data, customerId });
    return customer.save();
  }

  async updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findByIdAndUpdate(id, data, { new: true });
  }

  async addVehicleToCustomer(customerId: string, vehicle: any): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    return Customer.findByIdAndUpdate(
      customerId,
      { $push: { vehicles: vehicle } },
      { new: true }
    );
  }

  async getJobs(): Promise<IJob[]> {
    return Job.find().sort({ updatedAt: -1 });
  }

  async getJob(id: string): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findById(id);
  }

  async getJobsByCustomer(customerId: string): Promise<IJob[]> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return [];
    return Job.find({ customerId }).sort({ createdAt: -1 });
  }

  async getJobsByStage(stage: JobStage): Promise<IJob[]> {
    return Job.find({ stage }).sort({ updatedAt: -1 });
  }

  async getLastJobForVehicle(customerId: string, vehicleIndex: number): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    return Job.findOne({ 
      customerId, 
      vehicleIndex 
    }).sort({ createdAt: -1 });
  }

  async getVehicleServicePreferences(customerId: string, vehicleIndex: number): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.vehicles[vehicleIndex]) return null;
    const vehicle = customer.vehicles[vehicleIndex];
    return {
      ppfCategory: vehicle.ppfCategory,
      ppfVehicleType: vehicle.ppfVehicleType,
      ppfWarranty: vehicle.ppfWarranty,
      ppfPrice: vehicle.ppfPrice,
      laborCost: vehicle.laborCost,
      otherServices: vehicle.otherServices
    };
  }

  async updateVehiclePreferences(customerId: string, vehicleIndex: number, preferences: any): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.vehicles[vehicleIndex]) return null;
    
    const vehicle = customer.vehicles[vehicleIndex];
    if (preferences.ppfCategory) vehicle.ppfCategory = preferences.ppfCategory;
    if (preferences.ppfVehicleType) vehicle.ppfVehicleType = preferences.ppfVehicleType;
    if (preferences.ppfWarranty) vehicle.ppfWarranty = preferences.ppfWarranty;
    if (typeof preferences.ppfPrice === 'number') vehicle.ppfPrice = preferences.ppfPrice;
    if (typeof preferences.laborCost === 'number') vehicle.laborCost = preferences.laborCost;
    if (Array.isArray(preferences.otherServices)) vehicle.otherServices = preferences.otherServices;
    
    await customer.save();
    return customer;
  }

  async createJob(data: Partial<IJob>): Promise<IJob> {
    const job = new Job(data);
    return job.save();
  }

  async updateJob(id: string, data: Partial<IJob>): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true });
  }

  async updateJobStage(id: string, stage: JobStage): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Job.findByIdAndUpdate(id, { stage, updatedAt: new Date() }, { new: true });
  }

  async getTechnicians(): Promise<ITechnician[]> {
    return Technician.find().sort({ name: 1 });
  }

  async getTechnician(id: string): Promise<ITechnician | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Technician.findById(id);
  }

  async createTechnician(data: Partial<ITechnician>): Promise<ITechnician> {
    const technician = new Technician(data);
    return technician.save();
  }

  async updateTechnician(id: string, data: Partial<ITechnician>): Promise<ITechnician | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Technician.findByIdAndUpdate(id, data, { new: true });
  }

  async getTechnicianWorkload(): Promise<{ technician: ITechnician; jobCount: number }[]> {
    const technicians = await Technician.find();
    const workloads = await Promise.all(
      technicians.map(async (tech) => {
        const jobCount = await Job.countDocuments({
          technicianId: tech._id,
          stage: { $nin: ['Completed', 'Cancelled'] }
        });
        return { technician: tech, jobCount };
      })
    );
    return workloads;
  }

  async getInventory(): Promise<IInventoryItem[]> {
    return Inventory.find().sort({ category: 1, name: 1 });
  }

  async getInventoryItem(id: string): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findById(id);
  }

  async createInventoryItem(data: Partial<IInventoryItem>): Promise<IInventoryItem> {
    const item = new Inventory(data);
    return item.save();
  }

  async updateInventoryItem(id: string, data: Partial<IInventoryItem>): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findByIdAndUpdate(id, data, { new: true });
  }

  async adjustInventory(id: string, quantity: number): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Inventory.findByIdAndUpdate(id, { $inc: { quantity } }, { new: true });
  }

  async getLowStockItems(): Promise<IInventoryItem[]> {
    return Inventory.find({
      $expr: { $lte: ['$quantity', '$minStock'] }
    });
  }

  async getAppointments(): Promise<IAppointment[]> {
    return Appointment.find().sort({ date: 1, timeSlot: 1 });
  }

  async getAppointmentsByDate(date: Date): Promise<IAppointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timeSlot: 1 });
  }

  async createAppointment(data: Partial<IAppointment>): Promise<IAppointment> {
    const appointment = new Appointment(data);
    return appointment.save();
  }

  async updateAppointment(id: string, data: Partial<IAppointment>): Promise<IAppointment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Appointment.findByIdAndUpdate(id, data, { new: true });
  }

  async convertAppointmentToJob(appointmentId: string): Promise<IJob | null> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return null;

    let customer = await Customer.findOne({ phone: appointment.customerPhone });
    if (!customer) {
      const newCustomer = new Customer({
        name: appointment.customerName,
        phone: appointment.customerPhone,
        vehicles: [{
          make: '',
          model: appointment.vehicleInfo,
          year: '',
          plateNumber: appointment.plateNumber,
          color: ''
        }]
      });
      customer = await newCustomer.save();
    }

    const job = await this.createJob({
      customerId: customer._id as mongoose.Types.ObjectId,
      vehicleIndex: 0,
      customerName: customer.name,
      vehicleName: appointment.vehicleInfo,
      plateNumber: appointment.plateNumber,
      stage: 'New Lead',
      notes: `${appointment.serviceType}${appointment.notes ? ' - ' + appointment.notes : ''}`
    });

    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'Converted',
      jobId: job._id
    });

    return job;
  }

  async getWhatsAppTemplates(): Promise<IWhatsAppTemplate[]> {
    return WhatsAppTemplate.find().sort({ stage: 1 });
  }

  async updateWhatsAppTemplate(stage: JobStage, message: string, isActive: boolean): Promise<IWhatsAppTemplate | null> {
    return WhatsAppTemplate.findOneAndUpdate(
      { stage },
      { message, isActive },
      { new: true, upsert: true }
    );
  }

  async getDashboardStats() {
    const [
      totalJobs,
      activeJobs,
      completedJobs,
      jobsByStage,
      paidRevenue,
      pendingData
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ stage: { $nin: ['Completed', 'Cancelled'] } }),
      Job.countDocuments({ stage: 'Completed' }),
      Job.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]),
      Job.aggregate([
        { $match: { stage: 'Completed', paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Job.aggregate([
        { $match: { stage: 'Completed', paymentStatus: { $ne: 'Paid' } } },
        { $group: { _id: null, pending: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }
      ])
    ]);

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      pendingPayments: pendingData[0]?.pending || 0,
      totalRevenue: paidRevenue[0]?.total || 0,
      jobsByStage: jobsByStage.map(s => ({ stage: s._id, count: s.count }))
    };
  }

  async getInvoices(): Promise<IInvoice[]> {
    return Invoice.find().sort({ createdAt: -1 });
  }

  async getInvoice(id: string): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Invoice.findById(id);
  }

  async getInvoiceByJob(jobId: string): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
    return Invoice.findOne({ jobId });
  }

  async createInvoice(data: Partial<IInvoice>): Promise<IInvoice> {
    const invoice = new Invoice(data);
    return invoice.save();
  }

  async updateInvoice(id: string, data: Partial<IInvoice>): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Invoice.findByIdAndUpdate(id, data, { new: true });
  }

  async markInvoicePaid(id: string, paymentAmount?: number): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const invoice = await Invoice.findById(id);
    if (!invoice) return null;

    const remainingBalance = invoice.totalAmount - invoice.paidAmount;
    if (remainingBalance <= 0) return invoice;
    
    const requestedAmount = paymentAmount ?? remainingBalance;
    if (requestedAmount <= 0) return null;
    
    const actualApplied = Math.min(requestedAmount, remainingBalance);
    const newPaidAmount = invoice.paidAmount + actualApplied;
    
    const paymentStatus = newPaidAmount >= invoice.totalAmount ? 'Paid' : (newPaidAmount > 0 ? 'Partially Paid' : 'Pending');

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, {
      paidAmount: newPaidAmount,
      paymentStatus
    }, { new: true });

    if (updatedInvoice) {
      const job = await Job.findById(invoice.jobId);
      if (job) {
        const newJobPaidAmount = job.paidAmount + actualApplied;
        await Job.findByIdAndUpdate(invoice.jobId, {
          paidAmount: newJobPaidAmount,
          paymentStatus,
          payments: [...job.payments, { amount: actualApplied, mode: 'Cash', date: new Date(), notes: `Invoice ${invoice.invoiceNumber} payment` }],
          updatedAt: new Date()
        });
      }
    }

    return updatedInvoice;
  }

  async addPaymentToJobWithInvoiceSync(jobId: string, payment: { amount: number; mode: string; notes?: string }): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
    const job = await Job.findById(jobId);
    if (!job) return null;

    const jobRemainingBalance = Math.max(0, job.totalAmount - job.paidAmount);
    if (jobRemainingBalance <= 0) return job;
    
    const actualApplied = Math.min(payment.amount, jobRemainingBalance);
    if (actualApplied <= 0) return job;
    
    const newPaidAmount = job.paidAmount + actualApplied;
    let paymentStatus: 'Pending' | 'Partially Paid' | 'Paid' = 'Pending';
    
    if (newPaidAmount >= job.totalAmount) {
      paymentStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'Partially Paid';
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, {
      paidAmount: newPaidAmount,
      paymentStatus,
      payments: [...job.payments, { amount: actualApplied, mode: payment.mode, notes: payment.notes, date: new Date() }],
      updatedAt: new Date()
    }, { new: true });

    const invoice = await Invoice.findOne({ jobId });
    if (invoice) {
      const invoiceRemainingBalance = Math.max(0, invoice.totalAmount - invoice.paidAmount);
      const invoiceActualApplied = Math.min(actualApplied, invoiceRemainingBalance);
      if (invoiceActualApplied > 0) {
        const invoiceNewPaidAmount = invoice.paidAmount + invoiceActualApplied;
        const invoicePaymentStatus = invoiceNewPaidAmount >= invoice.totalAmount ? 'Paid' : (invoiceNewPaidAmount > 0 ? 'Partially Paid' : 'Pending');
        await Invoice.findByIdAndUpdate(invoice._id, {
          paidAmount: invoiceNewPaidAmount,
          paymentStatus: invoicePaymentStatus
        });
      }
    }

    return updatedJob;
  }

  async addMaterialsToJob(jobId: string, materials: { inventoryId: string; quantity: number }[]): Promise<IJob | null> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
    const job = await Job.findById(jobId);
    if (!job) return null;

    if (job.stage === 'Completed' || job.stage === 'Cancelled') {
      throw new Error('Cannot add materials to a completed or cancelled job');
    }

    const validatedMaterials: { item: IInventoryItem; quantity: number }[] = [];
    for (const mat of materials) {
      const item = await this.getInventoryItem(mat.inventoryId);
      if (!item) {
        throw new Error(`Inventory item not found: ${mat.inventoryId}`);
      }
      if (item.quantity < mat.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${item.quantity}, Requested: ${mat.quantity}`);
      }
      validatedMaterials.push({ item, quantity: mat.quantity });
    }

    const newMaterials: { inventoryId: mongoose.Types.ObjectId; name: string; quantity: number; cost: number }[] = [];
    for (const { item, quantity } of validatedMaterials) {
      newMaterials.push({
        inventoryId: item._id as mongoose.Types.ObjectId,
        name: item.name,
        quantity: quantity,
        cost: 0
      });
    }

    const allMaterials = [...job.materials, ...newMaterials];
    const materialsTotal = allMaterials.reduce((sum, m) => sum + m.cost, 0);
    const servicesTotal = job.serviceItems.reduce((sum, s) => sum + s.cost, 0);
    const serviceCost = job.serviceCost || 0;
    const totalAmount = materialsTotal + servicesTotal + serviceCost;

    const updatedJob = await Job.findByIdAndUpdate(jobId, {
      materials: allMaterials,
      totalAmount,
      updatedAt: new Date()
    }, { new: true });

    if (!updatedJob) {
      throw new Error('Failed to update job with materials');
    }

    for (const { item, quantity } of validatedMaterials) {
      await this.adjustInventory(item._id!.toString(), -quantity);
    }

    return updatedJob;
  }

  async generateInvoiceForJob(jobId: string, taxRate: number = 18, discount: number = 0): Promise<IInvoice | null> {
    const job = await this.getJob(jobId);
    if (!job) return null;

    const existingInvoice = await this.getInvoiceByJob(jobId);
    if (existingInvoice) return existingInvoice;

    const customer = await this.getCustomer(job.customerId.toString());

    const items: { description: string; quantity: number; unitPrice: number; total: number; type: 'service' | 'material' }[] = [];

    // Add service cost to invoice
    if (job.serviceCost && job.serviceCost > 0) {
      items.push({
        description: 'Service Charge',
        quantity: 1,
        unitPrice: job.serviceCost,
        total: job.serviceCost,
        type: 'service'
      });
    }

    // Add labor cost to invoice
    if (job.laborCost && job.laborCost > 0) {
      items.push({
        description: 'Labor Charge',
        quantity: 1,
        unitPrice: job.laborCost,
        total: job.laborCost,
        type: 'service'
      });
    }

    // Materials are tracked for inventory purposes only, not included in invoice pricing
    // Invoice uses only: Service Cost + Labor Cost + GST

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + tax - discount;

    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, '0')}`;

    const invoice = await this.createInvoice({
      invoiceNumber,
      jobId: job._id as mongoose.Types.ObjectId,
      customerId: job.customerId,
      customerName: job.customerName,
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email,
      customerAddress: customer?.address,
      vehicleName: job.vehicleName,
      plateNumber: job.plateNumber,
      items,
      subtotal,
      tax,
      taxRate,
      discount,
      totalAmount,
      paidAmount: job.paidAmount,
      paymentStatus: job.paymentStatus,
      notes: job.notes
    });

    return invoice;
  }
}

export const storage = new MongoStorage();
