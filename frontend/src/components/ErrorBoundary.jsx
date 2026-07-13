import { Component } from 'react'

class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled error in component tree:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="error-panel" role="alert">
          <p>Something went wrong</p>
          <button type="button" onClick={this.handleReload}>
            Reload
          </button>
        </section>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
