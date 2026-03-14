import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { SalaryRefProvider } from "@/lib/salaryRef";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/product/:id">
        {(params: any) => <Home initialProductId={params?.id} />}
      </Route>
      <Route path="/">{() => <Home />}</Route>
      <Route>{() => <NotFound />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <ThemeProvider>
        <LangProvider>
          <SalaryRefProvider>
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </SalaryRefProvider>
        </LangProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}

export default App;
