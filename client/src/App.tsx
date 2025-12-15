import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import Customers from "@/pages/customers";
import CustomerRegistration from "@/pages/register";
import CustomerFunnel from "@/pages/funnel";
import Technicians from "@/pages/technicians";
import Inventory from "@/pages/inventory";
import Appointments from "@/pages/appointments";
import Billing from "@/pages/billing";
import PaymentTracking from "@/pages/payments";
import WhatsApp from "@/pages/whatsapp";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/register" component={CustomerRegistration} />
        <Route path="/funnel" component={CustomerFunnel} />
        <Route path="/customers" component={Customers} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/technicians" component={Technicians} />
        <Route path="/billing" component={Billing} />
        <Route path="/payments" component={PaymentTracking} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/whatsapp" component={WhatsApp} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
