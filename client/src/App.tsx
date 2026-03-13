import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <ThemeProvider>
        <LangProvider>
<Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </LangProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}

export default App;
