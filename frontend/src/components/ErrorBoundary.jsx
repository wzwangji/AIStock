import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary]', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
                    <div className="max-w-md w-full rounded-lg border border-rose-700 bg-rose-950/30 p-6">
                        <h1 className="text-xl font-semibold text-rose-200">页面出错了</h1>
                        <p className="mt-2 text-sm text-rose-300 break-words">{String(this.state.error?.message || this.state.error)}</p>
                        <button
                            onClick={this.handleReset}
                            className="mt-4 inline-flex items-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
                        >
                            重试
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
