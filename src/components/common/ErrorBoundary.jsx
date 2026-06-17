import { Component } from 'react';

/**
 * ErrorBoundary - Catches render errors in child components.
 * Used to gracefully handle WebGL/Three.js failures.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />;
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] bg-[#EAECEF] rounded-xl">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-md mb-4 text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="font-medium text-slate-700 mb-2">
            3D rendering unavailable
          </h3>
          <p className="text-sm text-slate-400 mb-4 max-w-xs">
            Your browser may not support WebGL, or an error occurred while
            loading the 3D avatar.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-[#2a7e75] text-white text-sm rounded-lg hover:bg-[#236b63] transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
