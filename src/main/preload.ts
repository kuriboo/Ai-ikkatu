import { contextBridge, ipcRenderer, IpcRenderer } from 'electron';
import type { Settings } from '../shared/types';

// 型定義を明示的に宣言
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

interface ElectronAPI {
  loadSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<boolean>;
  startConversion: (data: {
    folderId: string;
    repoName: string;
    repoDir: string;
    aiMessage: string;
  }) => Promise<void>;
  onLogMessage: (callback: (message: string) => void) => () => void;
  onConversionComplete: (callback: () => void) => () => void;
  onConversionError: (callback: (error: string) => void) => () => void;
}

const electronAPI: ElectronAPI = {
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  startConversion: (data) => ipcRenderer.invoke('start-conversion', data),
  onLogMessage: (callback) => {
    const subscription = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on('log-message', subscription);
    return () => ipcRenderer.removeListener('log-message', subscription);
  },
  onConversionComplete: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('conversion-complete', subscription);
    return () => ipcRenderer.removeListener('conversion-complete', subscription);
  },
  onConversionError: (callback) => {
    const subscription = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on('conversion-error', subscription);
    return () => ipcRenderer.removeListener('conversion-error', subscription);
  }
};

// APIをウィンドウオブジェクトに公開
contextBridge.exposeInMainWorld('electronAPI', electronAPI);