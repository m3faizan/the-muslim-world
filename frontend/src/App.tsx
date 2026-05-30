import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CollectionProvider } from "@/context/CollectionContext";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import SiteDetail from "@/pages/SiteDetail";
import AuthPage from "@/pages/AuthPage";
import TrackerPage from "@/pages/TrackerPage";
import CollectionPage from "@/pages/CollectionPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/site/:id" component={SiteDetail} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/tracker" component={TrackerPage} />
      <Route path="/collection" component={CollectionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CollectionProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </CollectionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
