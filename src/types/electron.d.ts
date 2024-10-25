import type { UserSettings } from '../main/userSettings';

export  interface IpcApi {
    loadSettings: () => Promise<IUserSettings>;
    saveSettings: (settings: IUserSettings) => Promise<boolean>;
    startConversion: (settings: IUserSettings) => Promise<void>;
    onLogMessage: (callback: (message: string) => void) => () => void;
    onConversionComplete: (callback: () => void) => () => void;
    onConversionError: (callback: (error: string) => void) => () => void;
}

// プリロードスクリプトで使用するイベント型
export interface ElectronEvents {
    'log-message': string;
    'conversion-complete': void;
    'conversion-error': string;
}

declare global {
    interface Window {
        api: IpcApi;
    }
}

// メインプロセスとレンダラープロセス間の通信チャンネル名
export const IPC_CHANNELS = {
    LOAD_SETTINGS: 'load-settings',
    SAVE_SETTINGS: 'save-settings',
    START_CONVERSION: 'start-conversion',
    LOG_MESSAGE: 'log-message',
    CONVERSION_COMPLETE: 'conversion-complete',
    CONVERSION_ERROR: 'conversion-error'
} as const;

// チャンネル名の型
export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
  