import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@-label-/ui-internal-core';

interface Props {
  children: ReactNode;
  name: string;
}

interface State {
  error: Error | null;
  hasError: boolean;
}

export class MfeErrorBoundary extends Component<Props, State> {
  state: State = { error: null, hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`MFE "${this.props.name}" failed to load:`, error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Alert data-testid="mfe-error-boundary" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load {this.props.name}</AlertTitle>
          <AlertDescription>
            The micro-frontend could not be loaded. The remote server may be unavailable.
            {this.state.error ? <pre className="mt-2 text-xs">{this.state.error.message}</pre> : null}
          </AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}
