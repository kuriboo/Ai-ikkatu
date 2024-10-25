import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { IUserSettings } from './userSettings';

// IPCチャンネル名の定数
const IPC_CHANNELS = {
    LOAD_SETTINGS: 'load-settings',
    SAVE_SETTINGS: 'save-settings',
    START_CONVERSION: 'start-conversion',
    LOG_MESSAGE: 'log-message',
    CONVERSION_COMPLETE: 'conversion-complete',
    CONVERSION_ERROR: 'conversion-error'
} as const;

interface IpcApi {
    loadSettings: () => Promise<IUserSettings>;
    saveSettings: (settings: IUserSettings) => Promise<boolean>;
    startConversion: (settings: IUserSettings) => Promise<void>;
    onLogMessage: (callback: (message: string) => void) => () => void;
    onConversionComplete: (callback: () => void) => () => void;
    onConversionError: (callback: (error: string) => void) => () => void;
}

declare global {
    interface Window {
        api: IpcApi;
    }
}

const api: IpcApi = {
    loadSettings: async () => {
        try {
            return await ipcRenderer.invoke(IPC_CHANNELS.LOAD_SETTINGS);
        } catch (error) {
            console.error('Failed to load settings:', error);
            throw error;
        }
    },

    saveSettings: async (settings: IUserSettings) => {
        try {
            return await ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    },

    startConversion: async (settings: IUserSettings) => {
        try {
            await ipcRenderer.invoke(IPC_CHANNELS.START_CONVERSION, settings);
        } catch (error) {
            console.error('Failed to start conversion:', error);
            throw error;
        }
    },

    onLogMessage: (callback: (message: string) => void) => {
        const subscription = (_event: IpcRendererEvent, message: string) => {
            try {
                callback(message);
            } catch (error) {
                console.error('Error in log message callback:', error);
            }
        };
        ipcRenderer.on(IPC_CHANNELS.LOG_MESSAGE, subscription);
        return () => {
            try {
                ipcRenderer.removeListener(IPC_CHANNELS.LOG_MESSAGE, subscription);
            } catch (error) {
                console.error('Error removing log message listener:', error);
            }
        };
    },

    onConversionComplete: (callback: () => void) => {
        const subscription = (_event: IpcRendererEvent) => {
            try {
                callback();
            } catch (error) {
                console.error('Error in conversion complete callback:', error);
            }
        };
        ipcRenderer.on(IPC_CHANNELS.CONVERSION_COMPLETE, subscription);
        return () => {
            try {
                ipcRenderer.removeListener(IPC_CHANNELS.CONVERSION_COMPLETE, subscription);
            } catch (error) {
                console.error('Error removing conversion complete listener:', error);
            }
        };
    },

    onConversionError: (callback: (error: string) => void) => {
        const subscription = (_event: IpcRendererEvent, errorMessage: string) => {
            try {
                callback(errorMessage);
            } catch (error) {
                console.error('Error in conversion error callback:', error);
            }
        };
        ipcRenderer.on(IPC_CHANNELS.CONVERSION_ERROR, subscription);
        return () => {
            try {
                ipcRenderer.removeListener(IPC_CHANNELS.CONVERSION_ERROR, subscription);
            } catch (error) {
                console.error('Error removing conversion error listener:', error);
            }
        };
    }
};

// ウィンドウコントロールのAPIを追加
const windowControls = {
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  maximize: () => ipcRenderer.send('window-control', 'maximize'),
  close: () => ipcRenderer.send('window-control', 'close')
};

try {
    contextBridge.exposeInMainWorld('api', {
      ...windowControls,
      ...api
    });
    console.log('Preload script loaded successfully');
} catch (error) {
    console.error('Failed to expose API:', error);
}

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception in preload:', error);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    console.error('Unhandled Rejection in preload:', reason, 'Promise:', promise);
});



