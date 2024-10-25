const React = window.React;  // グローバルReactを使用
const { useState, useEffect, useRef } = React;
import type { IUserSettings } from '../../main/userSettings';

export const ConversionForm: React.FC = () => {
    const [settings, setSettings] = useState<IUserSettings | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        loadSettings();
        const cleanupListeners = setupEventListeners();
        return () => {
            cleanupListeners();
        };
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

    const setupEventListeners = () => {
        const unsubscribeComplete = window.api.onConversionComplete(() => {
            setIsConverting(false);
            showMessage('変換が完了しました', 'success');
        });

        const unsubscribeError = window.api.onConversionError((error) => {
            setIsConverting(false);
            showMessage(`変換に失敗しました: ${error}`, 'error');
        });

        const unsubscribeLog = window.api.onLogMessage((message) => {
            setLogs(prev => [...prev, message]);
        });

        return () => {
            unsubscribeComplete();
            unsubscribeError();
            unsubscribeLog();
        };
    };

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setIsConverting(true);
        setLogs([]); // ログをクリア
        try {
            await window.api.startConversion(settings);
            await window.api.saveSettings(settings); // 設定を保存
        } catch (error) {
            console.error('Failed to start conversion:', error);
            setIsConverting(false);
            showMessage('変換の開始に失敗しました', 'error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? {
            ...prev,
            [name]: value
        } : null);
    };

    // 設定が読み込まれるまでローディング表示
    if (!settings) {
        return (
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <p className="text-center text-gray-600">設定を読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-bold mb-4">変換実行</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="folderId">
                        Google DriveフォルダID
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        id="folderId"
                        name="folderId"
                        value={settings.folderId}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="repoName">
                        GitHubリポジトリ名
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        id="repoName"
                        name="repoName"
                        value={settings.repoName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="repoDir">
                        リポジトリパス
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        id="repoDir"
                        name="repoDir"
                        value={settings.repoDir}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="aiMessage">
                        AIへのメッセージ
                    </label>
                    <textarea
                        ref={editorRef}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="aiMessage"
                        name="aiMessage"
                        rows={10}
                        value={settings?.aiMessage || ''}
                        onChange={(e) => {
                            if (settings) {
                                setSettings({
                                    ...settings,
                                    aiMessage: e.target.value
                                });
                            }
                        }}
                        placeholder="AIへのメッセージを入力してください"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={isConverting}
                        className={`${
                            isConverting ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-700'
                        } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                    >
                        {isConverting ? '変換中...' : '変換開始'}
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

            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">実行ログ</h3>
                <div className="bg-gray-100 p-4 rounded-lg h-48 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <div className="text-gray-500 text-center">
                            ログはまだありません
                        </div>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="py-1">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};