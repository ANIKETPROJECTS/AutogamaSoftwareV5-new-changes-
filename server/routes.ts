import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendStageUpdateMessage, sendCustomerStatusUpdate } from "./whatsapp";
import { Customer, Admin } from "./models";
import type { JobStage, CustomerStatus } from "./models";

// Seed default admin user
async function seedAdminUser() {
  try {
    const existingAdmin = await Admin.findOne({ email: 'Autogarage@system.com' });
    if (!existingAdmin) {
      await Admin.create({
        email: 'Autogarage@system.com',
        password: 'Autogarage',
        name: 'Auto Garage Admin'
      });
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed admin user on startup
  await seedAdminUser();

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (admin.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({ 
        success: true, 
        user: { 
          id: admin._id, 
          email: admin.email, 
          name: admin.name 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Check auth status
  app.get("/api/auth/me", async (req, res) => {
    res.json({ authenticated: false });
  });

  app.get("/api/customers", async (req, res) => {
    try {
      const { search } = req.query;
      const customers = search 
        ? await storage.searchCustomers(search as string)
        : await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const existingCustomer = await storage.getCustomer(req.params.id);
      if (!existingCustomer) return res.status(404).json({ message: "Customer not found" });
      
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      
      if (req.body.status && req.body.status !== existingCustomer.status) {
        await sendCustomerStatusUpdate(customer.phone, req.body.status as CustomerStatus, customer.service);
      }
      
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.post("/api/customers/:id/vehicles", async (req, res) => {
    try {
      const customer = await storage.addVehicleToCustomer(req.params.id, req.body);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to add vehicle" });
    }
  });

  app.get("/api/customers/:id/jobs", async (req, res) => {
    try {
      const jobs = await storage.getJobsByCustomer(req.params.id);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer jobs" });
    }
  });

  app.get("/api/customers/:customerId/vehicles/:vehicleIndex/last-service", async (req, res) => {
    try {
      const job = await storage.getLastJobForVehicle(req.params.customerId, parseInt(req.params.vehicleIndex, 10));
      if (!job) return res.status(404).json({ message: "No previous service found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch last service" });
    }
  });

  app.get("/api/customers/:customerId/vehicles/:vehicleIndex/preferences", async (req, res) => {
    try {
      const prefs = await storage.getVehicleServicePreferences(req.params.customerId, parseInt(req.params.vehicleIndex, 10));
      if (!prefs) return res.status(404).json({ message: "No preferences found" });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const { stage } = req.query;
      const jobs = stage 
        ? await storage.getJobsByStage(stage as JobStage)
        : await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const job = await storage.createJob(req.body);
      const customer = await Customer.findById(job.customerId);
      if (customer) {
        await sendStageUpdateMessage(customer.phone, job.stage, job.vehicleName, job.plateNumber);
        
        // Save vehicle service preferences for auto-fill on next service
        const jobData = req.body as any;
        const ppfService = jobData.serviceItems?.find((item: any) => item.name?.startsWith('PPF'));
        const otherServices = jobData.serviceItems?.filter((item: any) => !item.name?.startsWith('PPF')).map((item: any) => ({
          name: item.name,
          vehicleType: item.vehicleType || '',
          price: item.price || 0
        })) || [];
        
        const preferences: any = {};
        if (ppfService) {
          preferences.ppfCategory = ppfService.category;
          preferences.ppfVehicleType = ppfService.vehicleType;
          preferences.ppfWarranty = ppfService.warranty;
          preferences.ppfPrice = ppfService.price;
        }
        if (req.body.laborCost) {
          preferences.laborCost = req.body.laborCost;
        }
        if (otherServices.length > 0) {
          preferences.otherServices = otherServices;
        }
        
        if (Object.keys(preferences).length > 0) {
          await storage.updateVehiclePreferences(job.customerId.toString(), job.vehicleIndex, preferences);
        }
      }
      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.patch("/api/jobs/:id/stage", async (req, res) => {
    try {
      const { stage } = req.body;
      
      // Check if job has an invoice - if so, block stage changes
      const existingInvoice = await storage.getInvoiceByJob(req.params.id);
      if (existingInvoice) {
        return res.status(409).json({ message: "Cannot change stage after invoice has been created" });
      }
      
      const job = await storage.updateJobStage(req.params.id, stage);
      if (!job) return res.status(404).json({ message: "Job not found" });
      
      const customer = await Customer.findById(job.customerId);
      if (customer) {
        await sendStageUpdateMessage(customer.phone, stage, job.vehicleName, job.plateNumber);
      }
      
      if (stage === 'Completed') {
        await storage.generateInvoiceForJob(req.params.id, 18, 0);
      }
      
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job stage" });
    }
  });

  app.post("/api/jobs/:id/payment", async (req, res) => {
    try {
      const payment = req.body;
      const updatedJob = await storage.addPaymentToJobWithInvoiceSync(req.params.id, payment);
      if (!updatedJob) return res.status(404).json({ message: "Job not found" });
      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ message: "Failed to add payment" });
    }
  });

  app.get("/api/technicians", async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.get("/api/technicians/workload", async (req, res) => {
    try {
      const workload = await storage.getTechnicianWorkload();
      res.json(workload);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technician workload" });
    }
  });

  app.post("/api/technicians", async (req, res) => {
    try {
      const technician = await storage.createTechnician(req.body);
      res.status(201).json(technician);
    } catch (error) {
      res.status(500).json({ message: "Failed to create technician" });
    }
  });

  app.patch("/api/technicians/:id", async (req, res) => {
    try {
      const technician = await storage.updateTechnician(req.params.id, req.body);
      if (!technician) return res.status(404).json({ message: "Technician not found" });
      res.json(technician);
    } catch (error) {
      res.status(500).json({ message: "Failed to update technician" });
    }
  });

  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const item = await storage.createInventoryItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Inventory creation error:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.patch("/api/inventory/:id/adjust", async (req, res) => {
    try {
      const { quantity } = req.body;
      const item = await storage.adjustInventory(req.params.id, quantity);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust inventory" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const { date } = req.query;
      const appointments = date 
        ? await storage.getAppointmentsByDate(new Date(date as string))
        : await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appointment = await storage.createAppointment(req.body);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, req.body);
      if (!appointment) return res.status(404).json({ message: "Appointment not found" });
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.post("/api/appointments/:id/convert", async (req, res) => {
    try {
      const job = await storage.convertAppointmentToJob(req.params.id);
      if (!job) return res.status(404).json({ message: "Appointment not found" });
      res.json(job);
    } catch (error) {
      console.error('Convert appointment error:', error);
      res.status(500).json({ message: "Failed to convert appointment", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/whatsapp/templates", async (req, res) => {
    try {
      const templates = await storage.getWhatsAppTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.patch("/api/whatsapp/templates/:stage", async (req, res) => {
    try {
      const { message, isActive } = req.body;
      const template = await storage.updateWhatsAppTemplate(
        req.params.stage as JobStage,
        message,
        isActive
      );
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.get("/api/jobs/:id/invoice", async (req, res) => {
    try {
      const invoice = await storage.getInvoiceByJob(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found for this job" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/jobs/:id/invoice", async (req, res) => {
    try {
      const { taxRate = 18, discount = 0 } = req.body;
      const invoice = await storage.generateInvoiceForJob(req.params.id, taxRate, discount);
      if (!invoice) return res.status(404).json({ message: "Job not found" });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  app.post("/api/jobs/:id/materials", async (req, res) => {
    try {
      const { materials } = req.body;
      const job = await storage.addMaterialsToJob(req.params.id, materials);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to add materials" });
    }
  });

  app.patch("/api/invoices/:id/pay", async (req, res) => {
    try {
      const { paidAmount } = req.body;
      const invoice = await storage.markInvoicePaid(req.params.id, paidAmount);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark invoice as paid" });
    }
  });

  return httpServer;
}
