const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dotenv = require('dotenv');
const { UserSettings } = require('./userSettings');

// 型定義
type MainWindow = {
    window: Electron.BrowserWindow | null;
};

// メインウィンドウの参照をオブジェクトとして保持
const mainWindow: MainWindow = {
    window: null
};

const IPC_CHANNELS = {
    LOAD_SETTINGS: 'load-settings',
    SAVE_SETTINGS: 'save-settings',
    START_CONVERSION: 'start-conversion',
    LOG_MESSAGE: 'log-message',
    CONVERSION_COMPLETE: 'conversion-complete',
    CONVERSION_ERROR: 'conversion-error'
} as const;

// 環境変数の読み込み
dotenv.config();

// UserSettingsのシングルトンインスタンス取得
const userSettings = UserSettings.getInstance();
userSettings.loadFromEnv();

// 開発環境かどうかの判定
const isDev = process.env.NODE_ENV !== 'production';

function createWindow(): void {
  
    mainWindow.window = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,  // ネイティブのタイトルバーを非表示
        webPreferences: {
            preload: path.join(__dirname, './preload.js'),
            contextIsolation: true,
            nodeIntegration: true
        }
    });

    // ウィンドウコントロールのイベントハンドラー
    ipcMain.on('window-control', (_event, command) => {
      switch (command) {
          case 'minimize':
              mainWindow.window?.minimize();
              break;
          case 'maximize':
              if (mainWindow.window?.isMaximized()) {
                  mainWindow.window?.unmaximize();
              } else {
                  mainWindow.window?.maximize();
              }
              break;
          case 'close':
              mainWindow.window?.close();
              break;
      }
    });

    if (isDev) {
        mainWindow.window.webContents.openDevTools();
    }

    const htmlPath = path.join(__dirname, '../renderer/index.html');
    console.log('Loading HTML from:', htmlPath);

    mainWindow.window.loadFile(htmlPath).catch((err) => {
        console.error('Failed to load HTML:', err);
    });

    mainWindow.window.on('ready-to-show', () => {
        mainWindow.window?.show();
    });

    mainWindow.window.on('closed', () => {
        mainWindow.window = null;
    });
}

// IPC通信ハンドラー
ipcMain.handle(IPC_CHANNELS.LOAD_SETTINGS, async () => {
    return userSettings.toJson();
});

ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, async (_event: Electron.IpcMainInvokeEvent, settings: typeof UserSettings) => {
    try {
        userSettings.updateFromJson(settings);
        userSettings.saveToEnv();
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
});

ipcMain.handle(IPC_CHANNELS.START_CONVERSION, async () => {
    try {
        const logCallback = (message: string) => {
            mainWindow.window?.webContents.send(IPC_CHANNELS.LOG_MESSAGE, message);
        };

        await require('../utils/conversionUtils').convertFiles(logCallback);
        mainWindow.window?.webContents.send(IPC_CHANNELS.CONVERSION_COMPLETE);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        mainWindow.window?.webContents.send(IPC_CHANNELS.CONVERSION_ERROR, errorMessage);
        throw error;
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

module.exports = {
    createWindow,
    IPC_CHANNELS
};