import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/dashboard";
import Connect from "@/pages/connect";
import Business from "@/pages/business";
import Products from "@/pages/products";
import Customers from "@/pages/customers";
import Chat from "@/pages/chat";
import Orders from "@/pages/orders";
import AiTraining from "@/pages/ai-training";
import Notifications from "@/pages/notifications";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Billing from "@/pages/billing";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/connect" component={Connect} />
        <Route path="/business" component={Business} />
        <Route path="/products" component={Products} />
        <Route path="/customers" component={Customers} />
        <Route path="/chat" component={Chat} />
        <Route path="/orders" component={Orders} />
        <Route path="/ai-training" component={AiTraining} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route path="/billing" component={Billing} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
