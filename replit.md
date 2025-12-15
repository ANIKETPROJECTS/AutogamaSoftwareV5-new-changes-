# AutoGarage CRM

## Overview

AutoGarage CRM is a web-based customer relationship management system designed for auto garages. It manages customers, vehicles, service jobs, technicians, inventory, appointments, billing, and WhatsApp automation. The application follows a job funnel workflow where each service visit moves through stages: New Lead → Inspection Done → Work In Progress → Ready for Delivery → Completed/Cancelled.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite
- **Charts**: Recharts for dashboard visualizations

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: REST endpoints under `/api/*`
- **Database ORM**: Mongoose for MongoDB
- **Schema Validation**: Zod with drizzle-zod integration

### Data Storage
- **Primary Database**: MongoDB (connected via `MONGODB_URI` environment variable)
- **Data Models**: Customer, Job, Technician, Inventory, Appointment, WhatsAppTemplate
- **Note**: Drizzle config exists for PostgreSQL but MongoDB/Mongoose is the active database layer

### Key Design Patterns
- **Monorepo Structure**: Client (`client/`), server (`server/`), and shared code (`shared/`)
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Storage Layer**: Abstract storage interface (`server/storage.ts`) for all database operations
- **API Client**: Centralized API wrapper (`client/src/lib/api.ts`) for frontend requests

### Core Business Logic
- Customers can have multiple vehicles
- Each vehicle can have multiple service jobs
- Jobs progress through defined stages with WhatsApp notifications
- Job cards track services, materials, payments, and technician assignments
- Inventory tracks stock levels with low-stock alerts

## External Dependencies

### Database
- **MongoDB**: Primary data store (requires `MONGODB_URI` environment variable)
- **PostgreSQL**: Configuration exists via Drizzle but not actively used

### Third-Party Services
- **WhatsApp API**: Placeholder functions for stage-based messaging automation (not yet integrated with real API)

### Key npm Packages
- `mongoose`: MongoDB ODM
- `express`: HTTP server framework
- `@tanstack/react-query`: Data fetching and caching
- `recharts`: Dashboard charts
- `date-fns`: Date formatting utilities
- `zod`: Runtime schema validation