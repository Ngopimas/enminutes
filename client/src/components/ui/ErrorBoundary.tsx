import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // error reporting hook can be wired here (e.g. Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Graphique indisponible / Chart unavailable
          </div>
        )
      );
    }
    return this.props.children;
  }
}
