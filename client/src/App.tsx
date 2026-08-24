import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminGovernorApplications from "./pages/AdminGovernorApplications";
import AdminReferralPerformance from "./pages/AdminReferralPerformance";
import About from "./pages/About";
import Home from "./pages/Home";
import MyApplications from "./pages/MyApplications";
import Champions from "./pages/Champions";
import Governors from "./pages/Governors";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hakkimizda" component={About} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/kullanicilar" component={AdminUsers} />
      <Route path="/admin/sehir-valisi-basvurulari" component={AdminGovernorApplications} />
      <Route path="/admin/davet-performanslari" component={AdminReferralPerformance} />
      <Route path="/basvurularim" component={MyApplications} />
      <Route path="/sampiyonlar" component={Champions} />
      <Route path="/valiler" component={Governors} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
