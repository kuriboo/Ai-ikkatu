const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

/**
 * ディレクトリが存在することを確認し、必要に応じて作成する
 * @param {string} dir - 作成するディレクトリのパス
 */
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

/**
 * ファイルをコピーする
 * @param {string} src - コピー元のファイルパス
 * @param {string} dest - コピー先のファイルパス
 */
function copyFile(src, dest) {
    try {
        ensureDirectoryExists(path.dirname(dest));
        fs.copyFileSync(src, dest);
        console.log(`Copied: ${src} -> ${dest}`);
    } catch (err) {
        console.error(`Error copying ${src}:`, err);
        throw err;
    }
}

/**
 * Reactの依存ファイルをコピーする
 */
function copyReactFiles() {
    // コピー先のnode_modulesディレクトリを作成
    const nodeModulesDir = path.join(rootDir, 'dist', 'renderer', 'node_modules');
    
    // React関連のディレクトリを作成
    ensureDirectoryExists(path.join(nodeModulesDir, 'react'));
    ensureDirectoryExists(path.join(nodeModulesDir, 'react-dom'));

    // React Core (UMD)
    copyFile(
        path.join(rootDir, 'node_modules', 'react', 'umd', 'react.development.js'),
        path.join(nodeModulesDir, 'react', 'index.js')
    );

    // React DOM (UMD)
    copyFile(
        path.join(rootDir, 'node_modules', 'react-dom', 'umd', 'react-dom.development.js'),
        path.join(nodeModulesDir, 'react-dom', 'index.js')
    );

    console.log('React files copied successfully');

}

/**
 * メイン処理
 */
async function main() {
    try {
        // HTMLファイルのコピー
        copyFile(
            path.join(rootDir, 'src', 'renderer', 'index.html'),
            path.join(rootDir, 'dist', 'renderer', 'index.html')
        );

        // Reactファイルのコピー
        copyReactFiles();

        console.log('File operations completed successfully!');
    } catch (err) {
        console.error('Error during file operations:', err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});