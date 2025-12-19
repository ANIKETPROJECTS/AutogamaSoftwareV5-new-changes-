import { queryClient } from './queryClient';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

export const api = {
  customers: {
    list: (search?: string) => request<any[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get: (id: string) => request<any>(`/customers/${id}`),
    create: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    addVehicle: (id: string, vehicle: any) => request<any>(`/customers/${id}/vehicles`, { method: 'POST', body: JSON.stringify(vehicle) }),
    getJobs: (id: string) => request<any[]>(`/customers/${id}/jobs`),
    getLastService: (customerId: string, vehicleIndex: number) => request<any>(`/customers/${customerId}/vehicles/${vehicleIndex}/last-service`),
  },
  
  jobs: {
    list: (stage?: string) => request<any[]>(`/jobs${stage ? `?stage=${encodeURIComponent(stage)}` : ''}`),
    get: (id: string) => request<any>(`/jobs/${id}`),
    create: (data: any) => request<any>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStage: (id: string, stage: string) => request<any>(`/jobs/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
    addPayment: (id: string, payment: any) => request<any>(`/jobs/${id}/payment`, { method: 'POST', body: JSON.stringify(payment) }),
    addMaterials: (id: string, materials: { inventoryId: string; quantity: number }[]) => 
      request<any>(`/jobs/${id}/materials`, { method: 'POST', body: JSON.stringify({ materials }) }),
    getInvoice: (id: string) => request<any>(`/jobs/${id}/invoice`),
    generateInvoice: (id: string, taxRate?: number, discount?: number) => 
      request<any>(`/jobs/${id}/invoice`, { method: 'POST', body: JSON.stringify({ taxRate: taxRate ?? 18, discount: discount ?? 0 }) }),
  },
  
  invoices: {
    list: () => request<any[]>('/invoices'),
    get: (id: string) => request<any>(`/invoices/${id}`),
    markPaid: (id: string, paidAmount?: number) => 
      request<any>(`/invoices/${id}/pay`, { method: 'PATCH', body: JSON.stringify({ paidAmount }) }),
  },
  
  technicians: {
    list: () => request<any[]>('/technicians'),
    workload: () => request<any[]>('/technicians/workload'),
    create: (data: any) => request<any>('/technicians', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/technicians/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  
  inventory: {
    list: () => request<any[]>('/inventory'),
    lowStock: () => request<any[]>('/inventory/low-stock'),
    create: (data: any) => request<any>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    adjust: (id: string, quantity: number) => request<any>(`/inventory/${id}/adjust`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  },
  
  appointments: {
    list: (date?: string) => request<any[]>(`/appointments${date ? `?date=${date}` : ''}`),
    create: (data: any) => request<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    convert: (id: string) => request<any>(`/appointments/${id}/convert`, { method: 'POST' }),
  },
  
  whatsapp: {
    templates: () => request<any[]>('/whatsapp/templates'),
    updateTemplate: (stage: string, message: string, isActive: boolean) => 
      request<any>(`/whatsapp/templates/${encodeURIComponent(stage)}`, { method: 'PATCH', body: JSON.stringify({ message, isActive }) }),
  },
  
  dashboard: {
    stats: () => request<any>('/dashboard'),
  },
};

export { queryClient };
