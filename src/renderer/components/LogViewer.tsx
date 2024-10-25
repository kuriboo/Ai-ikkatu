const React = window.React;  // グローバルReactを使用
const { useEffect, useRef } = React;

interface LogViewerProps {
    logs: string[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 新しいログが追加されたら自動スクロール
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // ログメッセージにタイムスタンプを追加
    const getFormattedLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}] ${message}`;
    };

    return (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-bold mb-4">実行ログ</h2>
            <div
                ref={logContainerRef}
                className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm"
            >
                {logs.length === 0 ? (
                    <div className="text-gray-500 text-center">
                        ログはまだありません
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={index}
                            className="py-1 border-b border-gray-200 last:border-b-0"
                        >
                            {getFormattedLog(log)}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};