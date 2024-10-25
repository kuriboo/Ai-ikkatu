// 共有される設定のインターフェース
export interface IUserSettings {
    driveCredentials: string;
    anthropicKey: string;
    githubToken: string;
    githubOwner: string;
    folderId: string;
    repoName: string;
    repoDir: string;
    localSavePath: string;
    aiMessage: string;
}

// シングルトンクラス
export class UserSettings implements IUserSettings {
    private static _instance: UserSettings | null = null;

    private constructor() {
        this.loadFromEnv();
    }

    public static getInstance(): UserSettings {
        if (!UserSettings._instance) {
            UserSettings._instance = new UserSettings();
        }
        return UserSettings._instance;
    }

    // IUserSettingsのプロパティ
    public driveCredentials: string = '';
    public anthropicKey: string = '';
    public githubToken: string = '';
    public githubOwner: string = '';
    public folderId: string = '';
    public repoName: string = '';
    public repoDir: string = '';
    public localSavePath: string = '';
    public aiMessage: string = '';

    public loadFromEnv(): void {
        this.driveCredentials = process.env.GOOGLE_DRIVE_CREDENTIALS || '';
        this.anthropicKey = process.env.ANTHROPIC_API_KEY || '';
        this.githubToken = process.env.GITHUB_TOKEN || '';
        this.githubOwner = process.env.GITHUB_OWNER || '';
        this.folderId = process.env.FOLDER_ID || '';
        this.repoName = process.env.GITHUB_REPO || '';
        this.repoDir = process.env.GITHUB_REPO_DIR || '';
        this.localSavePath = process.env.LOCAL_SAVE_PATH || '';
        this.aiMessage = process.env.AI_MESSAGE || '';
    }

    public saveToEnv(): void {
        process.env.GOOGLE_DRIVE_CREDENTIALS = this.driveCredentials;
        process.env.ANTHROPIC_API_KEY = this.anthropicKey;
        process.env.GITHUB_TOKEN = this.githubToken;
        process.env.GITHUB_OWNER = this.githubOwner;
        process.env.FOLDER_ID = this.folderId;
        process.env.GITHUB_REPO = this.repoName;
        process.env.GITHUB_REPO_DIR = this.repoDir;
        process.env.LOCAL_SAVE_PATH = this.localSavePath;
        process.env.AI_MESSAGE = this.aiMessage;
    }

    public updateFromJson(json: Partial<IUserSettings>): void {
        Object.assign(this, json);
    }

    public toJson(): IUserSettings {
        return {
            driveCredentials: this.driveCredentials,
            anthropicKey: this.anthropicKey,
            githubToken: this.githubToken,
            githubOwner: this.githubOwner,
            folderId: this.folderId,
            repoName: this.repoName,
            repoDir: this.repoDir,
            localSavePath: this.localSavePath,
            aiMessage: this.aiMessage
        };
    }
}