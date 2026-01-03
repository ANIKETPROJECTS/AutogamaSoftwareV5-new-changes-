import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendStageUpdateMessage } from "./whatsapp";
import { Customer, Admin } from "./models";
import type { JobStage, CustomerStatus } from "./models";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : `file://${process.cwd()}/server/routes.ts`);

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
  // Serve public quotations directory
  const quotationsDir = path.join(process.cwd(), "public", "quotations");
  if (!fs.existsSync(quotationsDir)) {
    fs.mkdirSync(quotationsDir, { recursive: true });
  }
  app.use("/q", express.static(quotationsDir));

  app.post("/api/price-inquiries/:id/generate-pdf", async (req, res) => {
    try {
      const { id } = req.params;
      const { html } = req.body;
      
      if (!html) {
        return res.status(400).json({ message: "HTML content is required" });
      }

      // Check for existing PDF for this inquiry to avoid duplicates
      if (fs.existsSync(quotationsDir)) {
        const files = fs.readdirSync(quotationsDir);
        const existingFile = files.find(f => f.startsWith(`quote_${id}_`) && f.endsWith('.pdf'));

        if (existingFile) {
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers['host'];
          return res.json({ url: `${protocol}://${host}/q/${existingFile}` });
        }
      } else {
        fs.mkdirSync(quotationsDir, { recursive: true });
      }

      const filename = `quote_${id}_${Date.now()}.pdf`;
      const filepath = path.join(quotationsDir, filename);

      // Save as PDF
      const puppeteer = require('puppeteer-core');
      const chromium = require('chrome-aws-lambda');

      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Add a small delay to ensure styles and images are loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      await page.pdf({
        path: filepath,
        format: 'A4',
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        printBackground: true,
        preferCSSPageSize: true
      });

      await browser.close();
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const publicUrl = `${protocol}://${host}/q/${filename}`;

      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Link generation error:", error);
      res.status(500).json({ message: "Failed to generate quotation link" });
    }
  });

  // Save PDF endpoint - receives PDF binary and saves to server
  app.post("/api/save-pdf", express.raw({ type: 'application/octet-stream' }), async (req, res) => {
    try {
      const inquiryId = req.query.inquiryId as string;
      const customerName = (req.query.customerName as string || '').replace(/\s+/g, '_');
      
      if (!inquiryId) {
        return res.status(400).json({ message: "Inquiry ID is required" });
      }

      if (!fs.existsSync(quotationsDir)) {
        fs.mkdirSync(quotationsDir, { recursive: true });
      }

      // Check for existing PDF for this inquiry to avoid duplicates
      const files = fs.readdirSync(quotationsDir);
      const searchPattern = customerName ? `quote_${customerName}_${inquiryId}_` : `quote_${inquiryId}_`;
      const existingFile = files.find(f => f.startsWith(searchPattern) && f.endsWith('.pdf'));

      if (existingFile) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        return res.json({ url: `${protocol}://${host}/q/${existingFile}` });
      }

      const pdfBuffer = req.body as Buffer;
      if (!pdfBuffer || pdfBuffer.length === 0) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      const filename = customerName ? `quote_${customerName}_${inquiryId}_${Date.now()}.pdf` : `quote_${inquiryId}_${Date.now()}.pdf`;
      const filepath = path.join(quotationsDir, filename);

      fs.writeFileSync(filepath, pdfBuffer);

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const publicUrl = `${protocol}://${host}/q/${filename}`;

      res.json({ url: publicUrl });
    } catch (error) {
      console.error("PDF save error:", error);
      res.status(500).json({ message: "Failed to save PDF" });
    }
  });

  // Check if PDF exists for an inquiry
  app.get("/api/check-pdf/:inquiryId", async (req, res) => {
    try {
      const { inquiryId } = req.params;

      if (!inquiryId) {
        return res.status(400).json({ message: "Inquiry ID is required" });
      }

      if (!fs.existsSync(quotationsDir)) {
        return res.json({ exists: false, url: null });
      }

      const files = fs.readdirSync(quotationsDir);
      const pdfFile = files.find(f => f.includes(`${inquiryId}_`) && f.endsWith('.pdf'));

      if (pdfFile) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'];
        const url = `${protocol}://${host}/q/${pdfFile}`;
        return res.json({ exists: true, url });
      }

      res.json({ exists: false, url: null });
    } catch (error) {
      console.error("PDF check error:", error);
      res.status(500).json({ message: "Failed to check PDF" });
    }
  });

  // Delete PDF endpoint - removes PDF when inquiry is deleted
  app.delete("/api/delete-pdf/:inquiryId", async (req, res) => {
    try {
      const { inquiryId } = req.params;

      if (!inquiryId) {
        return res.status(400).json({ message: "Inquiry ID is required" });
      }

      if (!fs.existsSync(quotationsDir)) {
        return res.json({ message: "No PDFs directory" });
      }

      const files = fs.readdirSync(quotationsDir);
      const pdfFile = files.find(f => f.includes(`${inquiryId}_`) && f.endsWith('.pdf'));

      if (pdfFile) {
        const filepath = path.join(quotationsDir, pdfFile);
        fs.unlinkSync(filepath);
      }

      res.json({ message: "PDF deleted" });
    } catch (error) {
      console.error("PDF delete error:", error);
      res.status(500).json({ message: "Failed to delete PDF" });
    }
  });

  // Seed admin user on startup
  try {
    await seedAdminUser();
  } catch (e) {
    console.error("Seeding failed but continuing:", e);
  }

  // Add a health check endpoint for Vercel
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.VERCEL ? "vercel" : "local" });
  });

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

  app.get("/api/customers/check-phone/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      const customer = await Customer.findOne({ phone });
      res.json({ exists: !!customer });
    } catch (error) {
      res.status(500).json({ message: "Failed to check phone number" });
    }
  });

  app.get("/api/customers", async (req, res) => {
    try {
      const { search, page = '1', limit = '10' } = req.query;
      const result = await storage.getCustomers({
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      });
      res.json(result);
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
    } catch (error: any) {
      console.error("Error creating customer:", error?.message || error);
      const message = error?.message || "Failed to create customer";
      res.status(500).json({ message });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      
      await storage.deleteCustomer(req.params.id);
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
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

  app.post("/api/customers/:id/service-images", async (req, res) => {
    try {
      const { images } = req.body;
      if (!Array.isArray(images)) {
        return res.status(400).json({ message: "Images must be an array" });
      }
      const customer = await storage.addServiceImages(req.params.id, images.slice(0, 5));
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to add service images" });
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
      const { stage, page = '1', limit = '10' } = req.query;
      const result = await storage.getJobs({
        stage: stage as JobStage,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      });
      res.json(result);
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
    let createdJobId: string | undefined;
    try {
      const job = await storage.createJob(req.body);
      createdJobId = job._id.toString();
      
      const customer = await Customer.findById(job.customerId);
      if (customer) {
        // Send WhatsApp message - this is non-critical, so we don't roll back if it fails
        try {
          await sendStageUpdateMessage(customer.phone, job.stage, job.vehicleName, job.plateNumber);
        } catch (waError) {
          console.error("WhatsApp notification failed:", waError);
        }
        
        // Save vehicle service preferences
        const jobData = req.body as any;
        const ppfService = jobData.serviceItems?.find((item: any) => item.name?.startsWith('PPF'));
        const otherServices = jobData.serviceItems?.filter((item: any) => !item.name?.startsWith('PPF')).map((item: any) => ({
          name: item.name,
          vehicleType: (item.vehicleType?.toLowerCase() === 'accessory' || item.category === 'Accessories' || item.name?.toLowerCase().includes('(x')) ? 'accessory' : 'service',
          price: item.price
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
      console.error("Job creation error:", error);
      
      // Rollback: if the job was created but subsequent logic failed, delete it
      if (createdJobId) {
        try {
          await storage.deleteJob(createdJobId);
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
      }
      
      res.status(500).json({ message: "Failed to create job", error: (error as any)?.message });
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
      const { stage, discount = 0, cancellationReason } = req.body;
      
      const currentJob = await storage.getJob(req.params.id);
      if (!currentJob) return res.status(404).json({ message: "Job not found" });

      // Prevent changes once marked 'Completed' or 'Cancelled'
      if (currentJob.stage === 'Completed') {
        return res.status(403).json({ message: "Cannot change status once marked as Completed" });
      }
      if (currentJob.stage === 'Cancelled') {
        return res.status(403).json({ message: "Cannot change status once marked as Cancelled" });
      }

      // Check if THIS JOB has an invoice
      // Each job is independent - a customer can have multiple jobs, each with its own invoice
      const existingInvoice = await storage.getInvoiceByJob(req.params.id);
      if (existingInvoice && stage !== 'Completed') {
        return res.status(409).json({ message: "Cannot change stage after invoice has been created" });
      }
      
      const job = await storage.updateJob(req.params.id, { 
        stage, 
        serviceItems: req.body.serviceItems,
        cancellationReason 
      });
      if (!job) return res.status(404).json({ message: "Job not found" });
      
      const customer = await Customer.findById(job.customerId);
      if (customer) {
        await sendStageUpdateMessage(customer.phone, stage, job.vehicleName, job.plateNumber);
      }
      
      if (stage === 'Completed') {
        try {
          const taxRate = 18;
          const discount = req.body.discount || 0;

          const itemsByBusiness: Record<string, any[]> = {};
          job.serviceItems.forEach((item: any) => {
            const biz = item.assignedBusiness || 'Auto Gamma';
            if (!itemsByBusiness[biz]) itemsByBusiness[biz] = [];
            itemsByBusiness[biz].push(item);
          });

          const businesses = Object.keys(itemsByBusiness);
          console.log(`[Invoice] Found items for businesses: ${JSON.stringify(businesses)}`);
          const invoices = [];

          for (const business of businesses) {
            console.log(`[Invoice] STARTING GENERATION for Job: ${req.params.id}, Business: "${business}"`);
            const invoice = await storage.generateInvoiceForJob(req.params.id, taxRate, discount, business);
            if (invoice) {
              console.log(`[Invoice] CREATED: ${invoice.invoiceNumber}, Business: "${invoice.business}", Total: ${invoice.totalAmount}`);
              invoices.push(invoice);
              // Wait a small amount to ensure distinct timestamps or sequence handling if needed
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }

          if (invoices.length === 0) {
            return res.status(500).json({ 
              message: "Failed to generate invoice for completed job"
            });
          }
          res.json({ ...job.toObject(), message: "Service completed & invoices created!", invoices });
        } catch (invoiceError) {
          console.error("Invoice generation error for job:", req.params.id, invoiceError);
          return res.status(500).json({ 
            message: "Job marked as completed but invoice generation failed",
            error: invoiceError instanceof Error ? invoiceError.message : "Unknown error"
          });
        }
        return;
      }
      
      res.json({ ...job.toObject(), message: "Status updated" });
    } catch (error) {
      console.error("Job stage update error:", error);
      res.status(500).json({ 
        message: "Failed to update job stage",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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

  app.get("/api/accessory-sales", async (req, res) => {
    try {
      const sales = await storage.getAccessorySales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessory sales" });
    }
  });

  app.post("/api/accessory-sales", async (req, res) => {
    try {
      const sale = await storage.createAccessorySale(req.body);
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to record accessory sale" });
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

  app.patch("/api/inventory/:id/consume-fifo", async (req, res) => {
    try {
      const { quantity } = req.body;
      const id = req.params.id;
      console.log(`[Inventory DEBUG] FIFO Consumption request for ${id}, qty: ${quantity}`);
      const result = await storage.consumeRollsWithFIFO(id, quantity);
      if (!result.success) {
        return res.status(400).json({ message: "Insufficient stock or item not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("[Inventory DEBUG] FIFO Consumption error:", error);
      res.status(500).json({ message: "Failed to process stock consumption" });
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

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      await storage.deleteInventoryItem(req.params.id);
      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
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

  app.post("/api/inventory/:id/rolls", async (req, res) => {
    try {
      const { id } = req.params;
      const rollData = req.body;
      let inventoryId = id;

      if (id.startsWith('temp-')) {
        const category = id.replace('temp-', '');
        let item = await Inventory.findOne({ category });
        if (!item) {
          item = await Inventory.create({
            name: category,
            category: category,
            quantity: 0,
            unit: 'rolls',
            minStock: 1,
            rolls: [],
            history: []
          });
        }
        inventoryId = item._id.toString();
      }

      const item = await storage.addRoll(inventoryId, rollData);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Add roll error:", error);
      res.status(500).json({ message: error.message || "Failed to add roll" });
    }
  });

  app.delete("/api/inventory/:id/rolls/:rollId", async (req, res) => {
    try {
      const item = await storage.deleteRoll(req.params.id, req.params.rollId);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete roll" });
    }
  });

  app.patch("/api/inventory/:id/rolls/:rollId/deduct", async (req, res) => {
    try {
      const { metersUsed } = req.body;
      const item = await storage.deductRoll(req.params.id, req.params.rollId, metersUsed);
      if (!item) return res.status(404).json({ message: "Item or roll not found" });
      res.json(item);
    } catch (error: any) {
      console.error("Deduct roll error:", error?.message || error);
      res.status(500).json({ message: error?.message || "Failed to deduct from roll" });
    }
  });

  app.patch("/api/inventory/:id/consume-fifo", async (req, res) => {
    try {
      const { quantity } = req.body;
      const result = await storage.consumeRollsWithFIFO(req.params.id, quantity);
      if (!result.success) return res.status(400).json({ message: "Failed to consume materials" });
      res.json(result);
    } catch (error: any) {
      console.error("Consume FIFO error:", error?.message || error);
      res.status(500).json({ message: error?.message || "Failed to consume materials using FIFO" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const { date, page = '1', limit = '10' } = req.query;
      const result = await storage.getAppointments({
        date: date ? new Date(date as string) : undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      });
      res.json(result);
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

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      await storage.deleteAppointment(req.params.id);
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
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
      
      if (!Array.isArray(materials)) {
        return res.status(400).json({ message: "Materials must be an array" });
      }

      for (const mat of materials) {
        const item = await storage.getInventoryItem(mat.inventoryId);
        if (!item) continue;
        
        // Calculate total available across all rolls
        let totalAvailable = 0;
        if (item.rolls && item.rolls.length > 0) {
          totalAvailable = item.rolls.reduce((sum, roll) => {
            if (roll.status !== 'Finished') {
              return sum + (roll.remaining_sqft || 0);
            }
            return sum;
          }, 0);
          console.log(`[Materials] Item: ${item.name}, Rolls Total: ${totalAvailable}, Stored Quantity: ${item.quantity}`);
        } else {
          totalAvailable = item.quantity || 0;
          console.log(`[Materials] Item: ${item.name}, Total available: ${totalAvailable}`);
        }

        if (mat.quantity > totalAvailable) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name}. Available: ${totalAvailable}, Requested: ${mat.quantity}` 
          });
        }
      }

      const job = await storage.addMaterialsToJob(req.params.id, materials);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to add materials" });
    }
  });

  app.patch("/api/invoices/:id/pay", async (req, res) => {
    try {
      const { paymentMode, otherPaymentDetails } = req.body;
      const invoice = await storage.markInvoicePaid(req.params.id, paymentMode, otherPaymentDetails);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark invoice as paid" });
    }
  });

  // Price Inquiries
  app.get("/api/price-inquiries", async (req, res) => {
    try {
      const { page = '1', limit = '10' } = req.query;
      const result = await storage.getPriceInquiries({
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price inquiries" });
    }
  });

  app.post("/api/price-inquiries", async (req, res) => {
    try {
      const inquiry = await storage.createPriceInquiry(req.body);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Price inquiry creation error:", error);
      res.status(500).json({ message: "Failed to create price inquiry", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/price-inquiries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete associated quotation files
      const quotationsDir = path.join(process.cwd(), "public", "quotations");
      if (fs.existsSync(quotationsDir)) {
        const files = fs.readdirSync(quotationsDir);
        files.forEach(file => {
          if (file.startsWith(`quote_${id}_`)) {
            try {
              fs.unlinkSync(path.join(quotationsDir, file));
              console.log(`Deleted quotation file: ${file}`);
            } catch (err) {
              console.error(`Error deleting file ${file}:`, err);
            }
          }
        });
      }

      await storage.deletePriceInquiry(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete inquiry error:", error);
      res.status(500).json({ message: "Failed to delete price inquiry" });
    }
  });

  app.patch("/api/settings/admin", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await Admin.findOne({ email: 'Autogarage@system.com' });
      if (!admin) return res.status(404).json({ message: "Admin not found" });
      
      const updateData: any = { name: username };
      if (password) {
        updateData.password = password;
      }
      
      const updatedAdmin = await Admin.findOneAndUpdate(
        { email: 'Autogarage@system.com' },
        updateData,
        { new: true }
      );
      
      res.json({ success: true, user: { email: updatedAdmin?.email, name: updatedAdmin?.name } });
    } catch (error) {
      res.status(500).json({ message: "Failed to update admin credentials" });
    }
  });

  return httpServer;
}
