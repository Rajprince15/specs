import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service (if configured)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
          <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h1>

              {/* Error Description */}
              <p className="text-gray-600 mb-8 max-w-md">
                We're sorry, but something unexpected happened. Don't worry, our team has been notified and we're working on it.
              </p>

              {/* Error Details (in development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full bg-gray-100 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs font-mono text-gray-600">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                        View stack trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>

                <Link
                  to="/"
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </Link>
              </div>

              {/* Additional Help */}
              <p className="mt-8 text-sm text-gray-500">
                If this problem persists, please{' '}
                <button
                  onClick={this.handleReload}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  refresh the page
                </button>
                {' '}or contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
