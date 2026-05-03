import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Onboarding from "./pages/Onboarding";
import Discover from "./pages/Discover";
import ListingDetail from "./pages/ListingDetail";
import Requests from "./pages/Requests";
import LearnerProfile from "./pages/LearnerProfile";
import ProviderProfile from "./pages/ProviderProfile";
import ProfilePicker from "./pages/ProfilePicker";
import AdultProfileEditor from "./pages/AdultProfileEditor";
import KidProfileEditor from "./pages/KidProfileEditor";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderRequests from "./pages/ProviderRequests";
import LearnerDashboard from "./pages/LearnerDashboard";
import ListingForm from "./pages/ListingForm";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/dashboard" element={<LearnerDashboard />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/profile" element={<ProfilePicker />} />
          <Route path="/profile/learner" element={<LearnerProfile />} />
          <Route path="/profile/adult/:id" element={<AdultProfileEditor />} />
          <Route path="/profile/kid/:id" element={<KidProfileEditor />} />
          <Route path="/profile/provider" element={<ProviderProfile />} />
          <Route path="/provider" element={<ProviderDashboard />} />
          <Route path="/provider/requests" element={<ProviderRequests />} />
          <Route path="/provider/listing/new" element={<ListingForm />} />
          <Route path="/provider/listing/:id" element={<ListingForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
