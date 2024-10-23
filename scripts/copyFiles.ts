import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESMでの__dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// プロジェクトのルートディレクトリを取得
const rootDir = path.resolve(__dirname, '..');

// ソースとビルド先のベースディレクトリを設定
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

// ディレクトリ存在確認関数
function ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

// ファイルコピー関数
function copyFile(src: string, dest: string): void {
    try {
        ensureDirectoryExists(path.dirname(dest));
        fs.copyFileSync(src, dest);
        console.log(`Copied: ${src} -> ${dest}`);
    } catch (err) {
        console.error(`Error copying ${src}:`, err);
        throw err;
    }
}

// メイン処理
async function main(): Promise<void> {
    try {
        // パス設定（tsconfig.jsonのrootDir: srcに合わせた構造）
        const srcPath = path.join(srcDir, 'renderer', 'index.html');
        const destPath = path.join(distDir, 'renderer', 'index.html');

        console.log('Source path:', srcPath);
        console.log('Destination path:', destPath);

        // ファイルのコピー
        copyFile(srcPath, destPath);

        console.log('File copied successfully!');
    } catch (err) {
        console.error('Error occurred while copying files:', err);
        process.exit(1);
    }
}

// スクリプトの実行
main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});