const React = window.React;  // グローバルReactを使用
const { useState, useEffect } = React;
import type { IUserSettings } from '../../main/userSettings';

export const SettingsForm: React.FC = () => {
    const [settings, setSettings] = useState<IUserSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await window.api.loadSettings();
            setSettings(savedSettings);
        } catch (error) {
            console.error('Failed to load settings:', error);
            showMessage('設定の読み込みに失敗しました', 'error');
        }
    };

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setIsSaving(true);
        try {
            const success = await window.api.saveSettings(settings);
            if (success) {
                showMessage('設定を保存しました', 'success');
            } else {
                showMessage('設定の保存に失敗しました', 'error');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            showMessage('設定の保存に失敗しました', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? {
            ...prev,
            [name]: value
        } : null);
    };

    if (!settings) {
        return (
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <p className="text-center text-gray-600">設定を読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-bold mb-4">API設定</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="driveCredentials">
                        Google Drive API認証情報（JSON）
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="driveCredentials"
                        name="driveCredentials"
                        value={settings.driveCredentials}
                        onChange={handleChange}
                        rows={4}
                        placeholder='{"installed":{"client_id":"...","project_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_secret":"...","redirect_uris":["..."]}}' 
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="anthropicKey">
                        Anthropic APIキー
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="password"
                        id="anthropicKey"
                        name="anthropicKey"
                        value={settings.anthropicKey}
                        onChange={handleChange}
                        placeholder="sk-ant-api03-..."
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="githubToken">
                        GitHubアクセストークン
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="password"
                        id="githubToken"
                        name="githubToken"
                        value={settings.githubToken}
                        onChange={handleChange}
                        placeholder="ghp_..."
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="githubOwner">
                        GitHubオーナー名
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        id="githubOwner"
                        name="githubOwner"
                        value={settings.githubOwner}
                        onChange={handleChange}
                        placeholder="your-github-username"
                        required
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className={`${
                            isSaving ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-700'
                        } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                    >
                        {isSaving ? '保存中...' : '設定を保存'}
                    </button>

                    {message && (
                        <span
                            className={`${
                                message.type === 'success' ? 'text-green-600' : 'text-red-600'
                            } ml-2`}
                        >
                            {message.text}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
};