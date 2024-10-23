import { ConversionForm } from './components/ConversionForm';
import { SettingsForm } from './components/SettingsForm';
import { LogViewer } from './components/LogViewer';

document.addEventListener('DOMContentLoaded', () => {
    const conversionFormContainer = document.getElementById('conversion-form-container');
    const settingsFormContainer = document.getElementById('settings-form-container');
    const logViewerContainer = document.getElementById('log-viewer-container');

    if (conversionFormContainer) {
        new ConversionForm(conversionFormContainer);
    }

    if (settingsFormContainer) {
        new SettingsForm(settingsFormContainer);
    }

    let logViewer: LogViewer | null = null;
    if (logViewerContainer) {
        logViewer = new LogViewer(logViewerContainer);
    }

    window.electronAPI.onLogMessage((message: string) => {
        if (logViewer) {
            logViewer.addLog(message);
        }
    });
});