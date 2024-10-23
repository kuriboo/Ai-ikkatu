// @ts-nocheck

import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
//import { convertFiles } from './conversionUtils';
import { Settings } from '../shared/types';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 開発環境かどうかの判定
const isDev = process.env.NODE_ENV !== 'production';

let convertFiles: any;

// 暗号化キーの設定
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  console.error('ENCRYPTION_KEYが設定されていません。.envファイルを確認してください。');
  app.quit();
}

// 設定ファイルのパス
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.enc');

// メインウィンドウの参照
let mainWindow: BrowserWindow | null = null;

// ウィンドウの作成関数
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(`http://localhost:${process.env.PORT || 3000}`);
    mainWindow.webContents.openDevTools();
  } else {
    const htmlPath = path.join(__dirname, '..', 'renderer', 'index.html');
    console.log('Loading HTML from:', htmlPath);  // デバッグ用
    mainWindow.loadFile(htmlPath);
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  /*mainWindow.on('closed', () => {
    mainWindow = null;
  });*/
}

// アプリの準備ができたらウィンドウを作成
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 全てのウィンドウが閉じられたらアプリを終了
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 暗号化関数
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// 復号化関数
function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// 設定の保存
ipcMain.handle('save-settings', async ( event: IpcMainInvokeEvent, settings: Settings ) => {
  try {
    const encryptedSettings = encrypt(JSON.stringify(settings));
    await fs.writeFile(SETTINGS_FILE, encryptedSettings);
    return true;
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    return false;
  }
});

// 設定の読み込み
ipcMain.handle('load-settings', async () => {
  try {
    const encryptedSettings = await fs.readFile(SETTINGS_FILE, 'utf8');
    const decryptedSettings = decrypt(encryptedSettings);
    return JSON.parse(decryptedSettings) as Settings;
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
    return {} as Settings;
  }
});

// ファイル変換プロセス
ipcMain.handle('start-conversion', async ( event: IpcMainInvokeEvent, data: { folderId: string, repoName: string, repoDir: string, aiMessage: string }) => {
  try {
    const { folderId, repoName, repoDir, aiMessage } = data;
    const encryptedSettings = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings: Settings = JSON.parse(decrypt(encryptedSettings));

    const logCallback = (message: string) => {
      mainWindow?.webContents.send('log-message', message);
    };

    const conversionUtils = await import('./conversionUtils');
    convertFiles = conversionUtils.convertFiles;

    await convertFiles(folderId, repoName, repoDir, aiMessage, settings, logCallback);

    mainWindow?.webContents.send('conversion-complete');
  } catch (error) {
    console.error('変換プロセス中にエラーが発生しました:', error);
    mainWindow?.webContents.send('conversion-error', (error as Error).message);
    throw error;
  }
});

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // エラーログの保存やユーザーへの通知を行うことができます
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // エラーログの保存やユーザーへの通知を行うことができます
});