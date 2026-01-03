import { Customer, Job, Technician, Inventory, Appointment, WhatsAppTemplate, Invoice, PriceInquiry, AccessorySale } from './models';
import type { ICustomer, IJob, ITechnician, IInventoryItem, IAppointment, IWhatsAppTemplate, IInvoice, JobStage, IPriceInquiry, IAccessorySale } from './models';
import mongoose from 'mongoose';

export interface IStorage {
  getCustomers(options?: { page?: number; limit?: number; search?: string }): Promise<{ customers: ICustomer[]; total: number }>;
  getCustomer(id: string): Promise<ICustomer | null>;
  searchCustomers(query: string): Promise<ICustomer[]>;
  createCustomer(data: Partial<ICustomer>): Promise<ICustomer>;
  updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer | null>;
  deleteCustomer(id: string): Promise<void>;
  addVehicleToCustomer(customerId: string, vehicle: any): Promise<ICustomer | null>;
  
  getJobs(options?: { page?: number; limit?: number; stage?: JobStage }): Promise<{ jobs: IJob[]; total: number }>;
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
  deleteInventoryItem(id: string): Promise<void>;
  adjustInventory(id: string, quantity: number): Promise<IInventoryItem | null>;
  getLowStockItems(): Promise<IInventoryItem[]>;
  getAccessorySales(): Promise<IAccessorySale[]>;
  createAccessorySale(data: Partial<IAccessorySale>): Promise<IAccessorySale>;
  
  addRoll(inventoryId: string, roll: any): Promise<IInventoryItem | null>;
  deleteRoll(inventoryId: string, rollId: string): Promise<IInventoryItem | null>;
  deductRoll(inventoryId: string, rollId: string, metersUsed: number): Promise<IInventoryItem | null>;
  consumeRollsWithFIFO(inventoryId: string, quantityNeeded: number): Promise<{ success: boolean; consumedRolls: { rollId: string; quantityUsed: number }[] }>;
  
  getAppointments(options?: { page?: number; limit?: number; date?: Date }): Promise<{ appointments: IAppointment[]; total: number }>;
  getAppointmentsByDate(date: Date): Promise<IAppointment[]>;
  createAppointment(data: Partial<IAppointment>): Promise<IAppointment>;
  updateAppointment(id: string, data: Partial<IAppointment>): Promise<IAppointment | null>;
  deleteAppointment(id: string): Promise<void>;
  convertAppointmentToJob(appointmentId: string): Promise<IJob | null>;
  
  getWhatsAppTemplates(): Promise<IWhatsAppTemplate[]>;
  updateWhatsAppTemplate(stage: JobStage, message: string, isActive: boolean): Promise<IWhatsAppTemplate | null>;
  
  getPriceInquiries(options?: { page?: number; limit?: number }): Promise<{ inquiries: IPriceInquiry[]; total: number }>;
  createPriceInquiry(data: Partial<IPriceInquiry>): Promise<IPriceInquiry>;
  deletePriceInquiry(id: string): Promise<void>;
  
  getInvoices(): Promise<IInvoice[]>;
  getInvoice(id: string): Promise<IInvoice | null>;
  getInvoiceByJob(jobId: string): Promise<IInvoice | null>;
  createInvoice(data: Partial<IInvoice>): Promise<IInvoice>;
  generateInvoiceForJob(jobId: string, taxRate?: number, discount?: number, business?: string): Promise<IInvoice | null>;
  
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
  async getCustomers(options: { page?: number; limit?: number; search?: string } = {}): Promise<{ customers: ICustomer[]; total: number }> {
    const { page = 1, limit = 10, search } = options;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: regex },
          { phone: regex },
          { 'vehicles.plateNumber': regex }
        ]
      };
    }
    
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(query)
    ]);
    
    return { customers, total };
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
    try {
      if (!data.name) throw new Error("Name is required");
      if (!data.phone) throw new Error("Phone number is required");

      const existingCustomer = await Customer.findOne({ phone: data.phone });
      if (existingCustomer) {
        throw new Error(`Customer with mobile number ${data.phone} already exists`);
      }
      
      const highestCustomer = await Customer.findOne({ customerId: { $regex: '^cus' } })
        .sort({ customerId: -1 })
        .select('customerId');
      
      let nextNumber = 1;
      if (highestCustomer && highestCustomer.customerId) {
        const currentNumber = parseInt(highestCustomer.customerId.replace('cus', ''), 10);
        nextNumber = currentNumber + 1;
      }
      
      const customerId = `cus${String(nextNumber).padStart(3, '0')}`;
      const customer = new Customer({ ...data, customerId });
      return await customer.save();
    } catch (error: any) {
      throw new Error(error?.message || "Failed to create customer in database");
    }
  }

  async updateCustomer(id: string, data: Partial<ICustomer>): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Customer.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    
    // Delete all associated jobs first
    await Job.deleteMany({ customerId: id });
    
    // Delete all associated price inquiries
    await PriceInquiry.deleteMany({ customerId: id });
    
    // Delete the customer
    await Customer.findByIdAndDelete(id);
  }

  async addVehicleToCustomer(customerId: string, vehicle: any): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    return Customer.findByIdAndUpdate(
      customerId,
      { $push: { vehicles: vehicle } },
      { new: true }
    );
  }

  async addServiceImages(customerId: string, images: string[]): Promise<ICustomer | null> {
    if (!mongoose.Types.ObjectId.isValid(customerId)) return null;
    return Customer.findByIdAndUpdate(
      customerId,
      { serviceImages: images },
      { new: true }
    );
  }

  async getJobs(options: { page?: number; limit?: number; stage?: JobStage } = {}): Promise<{ jobs: IJob[]; total: number }> {
    const { page = 1, limit = 10, stage } = options;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (stage) {
      query = { stage };
    }
    
    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query)
    ]);
    
    return { jobs, total };
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
      otherServices: vehicle.otherServices,
      customerSuppliedMaterial: customer.customerSuppliedMaterial,
      customerMaterialDetails: customer.customerMaterialDetails
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

  async deleteJob(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Job.findByIdAndDelete(id);
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

  async deleteInventoryItem(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Inventory.findByIdAndDelete(id);
  }

  async getLowStockItems(): Promise<IInventoryItem[]> {
    return Inventory.find({
      $expr: { $lte: ['$quantity', '$minStock'] }
    });
  }

  async getAccessorySales(): Promise<IAccessorySale[]> {
    return AccessorySale.find().sort({ date: -1 });
  }

  async createAccessorySale(data: Partial<IAccessorySale>): Promise<IAccessorySale> {
    const sale = new AccessorySale(data);
    return sale.save();
  }

  async addRoll(inventoryId: string, roll: any): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) return null;
    const newRoll = {
      _id: new mongoose.Types.ObjectId(),
      name: roll.name,
      meters: roll.meters,
      squareFeet: roll.squareFeet,
      remaining_meters: roll.meters,
      remaining_sqft: roll.squareFeet,
      status: 'Available',
      unit: (roll.unit === 'Square Feet' || roll.unit === 'Meters' || roll.unit === 'Square KM') ? roll.unit : 'Meters',
      createdAt: new Date()
    };
    
    const item = await Inventory.findById(inventoryId);
    if (!item) return null;
    
    item.rolls.push(newRoll);
    // Update total quantity based on unit
    const qtyToAdd = roll.unit === 'Square Feet' ? roll.squareFeet : roll.meters;
    item.quantity = (item.quantity || 0) + qtyToAdd;
    
    return await item.save();
  }

  async deleteRoll(inventoryId: string, rollId: string): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) return null;
    const item = await Inventory.findById(inventoryId);
    if (!item) return null;
    
    const rollIndex = item.rolls.findIndex(r => r._id?.toString() === rollId);
    if (rollIndex !== -1) {
      const roll = item.rolls[rollIndex];
      const qtyToRemove = roll.unit === 'Square Feet' ? roll.remaining_sqft : roll.remaining_meters;
      item.quantity = Math.max(0, (item.quantity || 0) - qtyToRemove);
      item.rolls.splice(rollIndex, 1);
      return await item.save();
    }
    return item;
  }

  async consumeRollsWithFIFO(inventoryId: string, quantityNeeded: number): Promise<{ success: boolean; consumedRolls: { rollId: string; quantityUsed: number }[] }> {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) return { success: false, consumedRolls: [] };
    const item = await Inventory.findById(inventoryId);
    if (!item || !item.rolls || item.rolls.length === 0) {
      return { success: false, consumedRolls: [] };
    }

    const consumedRolls: { rollId: string; quantityUsed: number }[] = [];
    let remaining = quantityNeeded;

    // Sort rolls by createdAt (FIFO - oldest first)
    const sortedRolls = [...item.rolls].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });

    for (const roll of sortedRolls) {
      if (remaining <= 0) break;
      if (!roll._id) continue;

      // Use the unit field to determine which quantity to use
      const availableQty = roll.unit === 'Square Feet' ? (roll.remaining_sqft || 0) : (roll.remaining_meters || 0);
      if (availableQty <= 0) continue;

      const toConsume = Math.min(remaining, availableQty);
      consumedRolls.push({ rollId: roll._id.toString(), quantityUsed: toConsume });
      remaining -= toConsume;

      // Update roll quantities based on unit
      if (roll.unit === 'Square Feet') {
        roll.remaining_sqft = Math.max(0, (roll.remaining_sqft || 0) - toConsume);
        // Sync meters proportionally if both exist
        if (roll.squareFeet > 0 && roll.meters > 0) {
          roll.remaining_meters = (roll.remaining_sqft / roll.squareFeet) * roll.meters;
        }
      } else {
        // Default to meters
        roll.remaining_meters = Math.max(0, (roll.remaining_meters || 0) - toConsume);
        // Sync sqft proportionally if both exist
        if (roll.meters > 0 && roll.squareFeet > 0) {
          roll.remaining_sqft = (roll.remaining_meters / roll.meters) * roll.squareFeet;
        }
      }

      // Mark as finished if depleted
      if ((roll.remaining_meters || 0) <= 0.01 && (roll.remaining_sqft || 0) <= 0.01) {
        console.log(`[Storage] Archiving roll in FIFO: ${roll.name}`);
        // Use toObject() to get a clean data object if it's a mongoose document
        const rollObj = (roll as any).toObject ? (roll as any).toObject() : { ...roll };
        const finishedRoll = {
          ...rollObj,
          remaining_meters: 0,
          remaining_sqft: 0,
          status: 'Finished',
          finishedAt: new Date()
        };
        
        // Use atomic update to ensure persistence
        await Inventory.findByIdAndUpdate(item._id, {
          $push: { finishedRolls: finishedRoll },
          $pull: { rolls: { _id: roll._id } }
        });
        
        console.log(`[Storage] Roll archived via atomic update for: ${roll.name}`);
      }
    }

    if (remaining > 0) {
      return { success: false, consumedRolls: [] };
    }

    // Since we used atomic updates for archiving, we only save if there were partial updates
    await item.save();
    return { success: true, consumedRolls };
  }

  async deductRoll(inventoryId: string, rollId: string, metersUsed: number): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(inventoryId)) return null;
    const item = await Inventory.findById(inventoryId);
    if (!item) return null;
    
    const rollIndex = item.rolls.findIndex(r => r._id?.toString() === rollId);
    if (rollIndex === -1) return null;
    const roll = item.rolls[rollIndex];
    
    // Handle deduction based on what we have available
    const hasSquareFeet = roll.remaining_sqft && roll.remaining_sqft > 0;
    
    if (hasSquareFeet) {
      roll.remaining_sqft = Math.max(0, roll.remaining_sqft - metersUsed);
      if (roll.squareFeet > 0 && roll.meters > 0) {
        roll.remaining_meters = (roll.remaining_sqft / roll.squareFeet) * roll.meters;
      }
    } else {
      roll.remaining_meters = Math.max(0, roll.remaining_meters - metersUsed);
      if (roll.meters > 0) {
        roll.remaining_sqft = (roll.remaining_meters / roll.meters) * roll.squareFeet;
      }
    }
    
    // Mark as Finished if depleted (using small epsilon for floating point)
    if ((roll.remaining_meters || 0) <= 0.01 && (roll.remaining_sqft || 0) <= 0.01) {
      console.log(`[Storage] Archiving roll in deductRoll: ${roll.name}`);
      
      const rollObj = (roll as any).toObject ? (roll as any).toObject() : { ...roll };
      const finishedRoll = {
        ...rollObj,
        remaining_meters: 0,
        remaining_sqft: 0,
        status: 'Finished',
        finishedAt: new Date()
      };
      
      await Inventory.findByIdAndUpdate(item._id, {
        $push: { finishedRolls: finishedRoll },
        $pull: { rolls: { _id: roll._id } }
      });
      
      console.log(`[Storage] Roll archived via atomic update in deductRoll for: ${roll.name}`);
      return Inventory.findById(item._id);
    }
    
    await item.save();
    return item;
  }

  async getAppointments(options: { page?: number; limit?: number; date?: Date } = {}): Promise<{ appointments: IAppointment[]; total: number }> {
    const { page = 1, limit = 10, date } = options;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query = { date: { $gte: startOfDay, $lte: endOfDay } };
    }
    
    const [appointments, total] = await Promise.all([
      Appointment.find(query).sort({ date: 1, time: 1 }).skip(skip).limit(limit),
      Appointment.countDocuments(query)
    ]);
    
    return { appointments, total };
  }

  async getAppointmentsByDate(date: Date): Promise<IAppointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ time: 1 });
  }

  async createAppointment(data: Partial<IAppointment>): Promise<IAppointment> {
    const appointment = new Appointment(data);
    return appointment.save();
  }

  async updateAppointment(id: string, data: Partial<IAppointment>): Promise<IAppointment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Appointment.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteAppointment(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Appointment.findByIdAndDelete(id);
  }

  async convertAppointmentToJob(appointmentId: string): Promise<IJob | null> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return null;

    let customer = await Customer.findOne({ phone: appointment.customerPhone });
    if (!customer) {
      const newCustomer = new Customer({
        name: appointment.customerName,
        phone: appointment.customerPhone,
        email: appointment.customerEmail,
        vehicles: [{
          make: '',
          model: appointment.vehicleInfo,
          year: '',
          plateNumber: '',
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
      plateNumber: '',
      stage: 'New Lead',
      notes: `${appointment.serviceType}${appointment.notes ? ' - ' + appointment.notes : ''}`
    });

    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'Done',
      jobId: job._id
    });

    return job;
  }

  async getWhatsAppTemplates(): Promise<IWhatsAppTemplate[]> {
    const templates = await WhatsAppTemplate.find();
    const stageOrder = ['New Lead', 'Inspection Done', 'Work In Progress', 'Completed', 'Cancelled'];
    return templates.sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));
  }

  async updateWhatsAppTemplate(stage: JobStage, message: string, isActive: boolean): Promise<IWhatsAppTemplate | null> {
    return WhatsAppTemplate.findOneAndUpdate(
      { stage },
      { message, isActive },
      { new: true, upsert: true }
    );
  }

  async getPriceInquiries(options: { page?: number; limit?: number } = {}): Promise<{ inquiries: IPriceInquiry[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    
    const [inquiries, total] = await Promise.all([
      PriceInquiry.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      PriceInquiry.countDocuments()
    ]);
    
    return { inquiries, total };
  }

  async createPriceInquiry(data: Partial<IPriceInquiry>): Promise<IPriceInquiry> {
    const highestInquiry = await PriceInquiry.findOne({ inquiryId: { $regex: '^INQ' } })
      .sort({ createdAt: -1 })
      .select('inquiryId');
    
    let nextNumber = 1;
    if (highestInquiry && highestInquiry.inquiryId) {
      const match = highestInquiry.inquiryId.match(/(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    const inquiryId = `INQ${String(nextNumber).padStart(3, '0')}`;
    const inquiry = new PriceInquiry({ ...data, inquiryId });
    return inquiry.save();
  }

  async deletePriceInquiry(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await PriceInquiry.findByIdAndDelete(id);
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
      Job.countDocuments({ stage: { $ne: 'Completed' } }),
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

  async markInvoicePaid(id: string, paymentMode?: string, otherPaymentDetails?: string): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const invoice = await Invoice.findById(id);
    if (!invoice) return null;

    const remainingBalance = invoice.totalAmount - invoice.paidAmount;
    if (remainingBalance <= 0) return invoice;
    
    const actualApplied = remainingBalance;
    const newPaidAmount = invoice.paidAmount + actualApplied;
    
    const paymentStatus = 'Paid';

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, {
      paidAmount: newPaidAmount,
      paymentStatus,
      paymentMode: paymentMode || invoice.paymentMode,
      otherPaymentDetails: otherPaymentDetails || invoice.otherPaymentDetails
    }, { new: true });

    if (updatedInvoice) {
      const job = await Job.findById(invoice.jobId);
      if (job) {
        const newJobPaidAmount = job.paidAmount + actualApplied;
        await Job.findByIdAndUpdate(invoice.jobId, {
          paidAmount: newJobPaidAmount,
          paymentStatus,
          payments: [...job.payments, { 
            amount: actualApplied, 
            mode: (paymentMode as any) || 'Cash', 
            date: new Date(), 
            otherPaymentDetails,
            notes: `Invoice ${invoice.invoiceNumber} payment` 
          }],
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

    const validatedMaterials: { item: IInventoryItem; quantity: number; rollUsage?: { rollId: string; rollName: string; quantityUsed: number }[] }[] = [];
    for (const mat of materials) {
      const item = await this.getInventoryItem(mat.inventoryId);
      if (!item) {
        throw new Error(`Inventory item not found: ${mat.inventoryId}`);
      }
      
      let rollUsage: { rollId: string; rollName: string; quantityUsed: number }[] | undefined;

      // For items with rolls, validate using FIFO logic
      if (item.rolls && item.rolls.length > 0) {
        const totalAvailable = item.rolls.reduce((sum, r) => {
          const qty = r.unit === 'Square Feet' ? (r.remaining_sqft || 0) : (r.remaining_meters || 0);
          return sum + qty;
        }, 0);
        if (totalAvailable < mat.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${totalAvailable}, Requested: ${mat.quantity}`);
        }

        const result = await this.consumeRollsWithFIFO(item._id!.toString(), mat.quantity);
        if (!result.success) {
          throw new Error(`Failed to consume rolls for ${item.name}`);
        }

        rollUsage = result.consumedRolls.map(cr => {
          // Check item.rolls first, then item.finishedRolls
          const roll = (item.rolls || []).find(r => r._id?.toString() === cr.rollId) || 
                       (item.finishedRolls || []).find(r => r._id?.toString() === cr.rollId);
          return {
            rollId: cr.rollId,
            rollName: roll?.name || 'Inventory Item',
            quantityUsed: cr.quantityUsed
          };
        });
      } else {
        // For items without rolls, validate normal stock
        if (item.quantity < mat.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${item.quantity}, Requested: ${mat.quantity}`);
        }
        await this.adjustInventory(item._id!.toString(), -mat.quantity);
      }
      
      validatedMaterials.push({ item, quantity: mat.quantity, rollUsage });
    }

    const newMaterials: any[] = validatedMaterials.map(({ item, quantity, rollUsage }) => ({
      inventoryId: item._id as mongoose.Types.ObjectId,
      name: item.name,
      quantity: quantity,
      cost: 0,
      rollDetails: rollUsage
    }));

    const allMaterials = [...job.materials, ...newMaterials];
    const materialsTotal = allMaterials.reduce((sum, m) => sum + m.cost, 0);
    const servicesTotal = job.serviceItems.reduce((sum, s) => sum + (s.price - (s.discount || 0)), 0);
    const subtotal = materialsTotal + servicesTotal;
    const appliedTaxRate = job.requiresGST ? 18 : 0;
    const totalAmount = subtotal + (subtotal * appliedTaxRate / 100);

    const updatedJob = await Job.findByIdAndUpdate(jobId, {
      materials: allMaterials,
      totalAmount,
      updatedAt: new Date()
    }, { new: true });

    return updatedJob;
  }

  async generateInvoiceForJob(jobId: string, taxRate: number = 18, discount: number = 0, business?: string): Promise<IInvoice | null> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
    const job = await Job.findById(jobId);
    if (!job) return null;

    console.log(`Generating invoice for Job: ${jobId}, Business: ${business}`);
    // Filter service items by business if specified
    const filteredServiceItems = business 
      ? job.serviceItems.filter((item: any) => {
          const itemBiz = item.assignedBusiness || 'Auto Gamma';
          const matches = itemBiz === business;
          console.log(`  Item: ${item.name}, Assigned to: ${itemBiz}, Matches ${business}: ${matches}`);
          return matches;
        })
      : job.serviceItems;

    // IMPORTANT: Check if we have items for this business
    if (filteredServiceItems.length === 0) {
      console.log(`No items found for business: ${business}`);
      return null;
    }

    // Fetch customer to get phone number
    const customer = await Customer.findById(job.customerId);
    if (!customer) return null;

    const materialsTotal = (!business || business === 'Auto Gamma') ? job.materials.reduce((sum, m) => sum + m.cost, 0) : 0;
    const servicesTotal = filteredServiceItems.reduce((sum, s) => sum + (s.price - (s.discount || 0)), 0);
    
    // Add labor charges to services total if present
    const totalLabor = (job.laborCost && job.laborCost > 0) ? job.laborCost : 0;
    const subtotal = materialsTotal + servicesTotal + totalLabor;
    
    const appliedTaxRate = job.requiresGST ? taxRate : 0;
    const taxAmount = (subtotal * appliedTaxRate) / 100;
    const totalAmount = subtotal + taxAmount - (business === 'Auto Gamma' || !business ? discount : 0);

    const highestInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
    let nextNumber = 1;
    if (highestInvoice && highestInvoice.invoiceNumber) {
      const match = highestInvoice.invoiceNumber.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }
    const invoiceNumber = `INV${String(nextNumber).padStart(4, '0')}`;

    // Build invoice items from service items and materials
    const invoiceItems: any[] = filteredServiceItems.map(s => ({
      description: s.name,
      quantity: 1,
      unitPrice: s.price,
      total: s.price - (s.discount || 0),
      type: 'service',
      discount: s.discount || 0,
      assignedBusiness: s.assignedBusiness || 'Auto Gamma'
    }));

    // Add labor charges if they exist for this job and aren't already in the list
    if (job.laborCost && job.laborCost > 0) {
      const laborAlreadyAdded = invoiceItems.some(item => 
        item.description.toLowerCase().includes("labor")
      );
      
      if (!laborAlreadyAdded) {
        invoiceItems.push({
          description: "Labor Charge",
          quantity: 1,
          unitPrice: job.laborCost,
          total: job.laborCost,
          type: 'service',
          discount: 0,
          assignedBusiness: business || 'Auto Gamma'
        });
      }
    }

    // Ensure Business 2 invoices don't include materials by default unless assigned
    if (!business || business === 'Auto Gamma') {
      job.materials.forEach(m => {
        invoiceItems.push({
          description: m.name,
          quantity: m.quantity,
          unitPrice: m.cost / m.quantity,
          total: m.cost,
          type: 'material' as const
        });
      });
    }

    // Standardize business name for consistent matching
    const finalBusiness = (business && (business === "Business 2" || business.trim().toLowerCase() === "business 2" || business.toLowerCase().includes("business 2"))) 
      ? "Business 2" 
      : "Auto Gamma";

    const invoice = new Invoice({
      jobId: job._id,
      customerId: job.customerId,
      customerName: job.customerName,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAddress: customer.address,
      vehicleName: job.vehicleName,
      plateNumber: job.plateNumber,
      invoiceNumber,
      items: invoiceItems,
      subtotal,
      tax: taxAmount,
      taxRate: appliedTaxRate,
      discount: (finalBusiness === 'Auto Gamma') ? discount : 0,
      totalAmount,
      paidAmount: (finalBusiness === 'Auto Gamma') ? job.paidAmount : 0,
      paymentStatus: (finalBusiness === 'Auto Gamma') ? job.paymentStatus : 'Pending',
      business: finalBusiness
    });

    console.log(`[Invoice Storage] SAVING INVOICE: ${invoiceNumber} | FINAL BUSINESS: "${invoice.business}" | ITEMS: ${invoiceItems.length}`);
    await invoice.save();
    
    // Only update job total if we are looking at the primary business or no business specified
    // In multi-business, the job total might be a combination, but the storage currently syncs it
    if ((!business || business === 'Auto Gamma') && job.totalAmount !== totalAmount) {
      await Job.findByIdAndUpdate(jobId, { totalAmount });
    }
    
    return invoice;
  }
}

export const storage = new MongoStorage();
