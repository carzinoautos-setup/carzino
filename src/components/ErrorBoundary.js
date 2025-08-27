import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service (if available)
    if (window.reportError) {
      window.reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: this.state.retryCount + 1 
    });
  };

  handleReset = () => {
    // Clear any cached data that might be causing issues
    if (this.props.onReset) {
      this.props.onReset();
    }
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: CustomFallback, level = 'component' } = this.props;
      
      // Use custom fallback if provided
      if (CustomFallback) {
        return (
          <CustomFallback 
            error={this.state.error}
            retry={this.handleRetry}
            reset={this.handleReset}
            retryCount={this.state.retryCount}
          />
        );
      }

      // Default fallback UI based on error level
      const errorStyles = {
        app: {
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
          backgroundColor: '#f9fafb',
          textAlign: 'center'
        },
        section: {
          padding: '40px 20px',
          margin: '20px 0',
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          backgroundColor: '#fef2f2',
          textAlign: 'center'
        },
        component: {
          padding: '20px',
          margin: '10px 0',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          textAlign: 'center'
        }
      };

      const style = errorStyles[level] || errorStyles.component;

      return (
        <div style={style}>
          <div style={{ maxWidth: '500px' }}>
            <h2 style={{ 
              color: '#dc2626', 
              marginBottom: '16px',
              fontSize: level === 'app' ? '24px' : '20px'
            }}>
              {level === 'app' ? '🚨 Application Error' : 
               level === 'section' ? '⚠️ Section Error' : 
               '❌ Component Error'}
            </h2>
            
            <p style={{ 
              color: '#374151', 
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              {level === 'app' 
                ? 'Something went wrong with the application. This is likely a temporary issue.'
                : level === 'section'
                ? 'This section encountered an error but the rest of the app should work normally.'
                : 'This component encountered an error but other parts should work normally.'
              }
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                {this.state.retryCount > 0 ? 'Try Again' : 'Retry'}
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
              >
                Reset
              </button>

              {level === 'app' && (
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
                >
                  Reload Page
                </button>
              )}
            </div>

            {this.state.retryCount > 2 && (
              <p style={{ 
                marginTop: '16px', 
                fontSize: '14px', 
                color: '#6b7280' 
              }}>
                If this keeps happening, try refreshing the page or contact support.
              </p>
            )}

            {process.env.NODE_ENV === 'development' && (
              <details style={{ 
                marginTop: '24px', 
                textAlign: 'left',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ 
                  backgroundColor: '#f3f4f6', 
                  padding: '12px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '11px'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
