const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useEffect } = React;

import { ConversionForm } from './components/ConversionForm';
import { SettingsForm } from './components/SettingsForm';
import { LogViewer } from './components/LogViewer';

const App: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const unsubscribe = window.api.onLogMessage((message: string) => {
            setLogs(prev => [...prev, message]);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return React.createElement('div', { className: "container mx-auto p-4" }, [
        React.createElement('h1', { className: "text-3xl font-bold mb-6", key: 'title' }, "AI変換ツール"),
        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", key: 'forms' }, [
            React.createElement('div', { key: 'conversion' }, React.createElement(ConversionForm)),
            React.createElement('div', { key: 'settings' }, React.createElement(SettingsForm))
        ]),
        React.createElement('div', { className: "mt-6", key: 'logs' },
            React.createElement(LogViewer, { logs })
        )
    ]);
};

const container = document.getElementById('app');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
}