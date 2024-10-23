import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

loader.config({ monaco });

export class ConversionForm {
    private container: HTMLElement;
    private form!: HTMLFormElement; // 変更: definite assignment assertionを追加
    private submitButton!: HTMLButtonElement; // 変更: definite assignment assertionを追加
    private aiMessageEditor: monaco.editor.IStandaloneCodeEditor | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.createForm();
        this.attachEventListeners();
        this.initMonacoEditor();
    }

    private createForm() {
        this.form = document.createElement('form');
        this.form.className = 'bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4';
        this.form.innerHTML = `
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="folderId">
                    Google DriveフォルダID
                </label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="folderId" name="folderId" type="text" placeholder="フォルダIDを入力">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="repoName">
                    GitHubリポジトリ名
                </label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="repoName" name="repoName" type="text" placeholder="リポジトリ名を入力">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="repoDir">
                    GitHubリポジトリディレクトリ
                </label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="repoDir" name="repoDir" type="text" placeholder="ディレクトリパスを入力">
            </div>
            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="aiMessage">
                    AIへのメッセージ
                </label>
                <div id="aiMessageEditor" style="height: 200px; border: 1px solid #ccc;"></div>
            </div>
            <div class="flex items-center justify-between">
                <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                    変換開始
                </button>
            </div>
        `;
        this.container.appendChild(this.form);
        this.submitButton = this.form.querySelector('button[type="submit"]') as HTMLButtonElement;
    }

    private attachEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    private async initMonacoEditor() {
        const editorContainer = document.getElementById('aiMessageEditor');
        if (editorContainer) {
            this.aiMessageEditor = monaco.editor.create(editorContainer, {
                value: '',
                language: 'plaintext',
                theme: 'vs-light',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'off',
                glyphMargin: false,
                folding: false,
                // Undocumented options:
                // lineDecorationsWidth: 0,
                // lineNumbersMinChars: 0,
                // overviewRulerBorder: false,
            });

            // エディタのサイズをコンテナに合わせる
            const resizeEditor = () => {
                this.aiMessageEditor?.layout();
            };
            window.addEventListener('resize', resizeEditor);
            resizeEditor();
        }
    }

    private async handleSubmit(event: Event) {
        event.preventDefault();
        this.submitButton.disabled = true;
        this.submitButton.textContent = '変換中...';

        const formData = new FormData(this.form);
        const data = {
            folderId: formData.get('folderId') as string,
            repoName: formData.get('repoName') as string,
            repoDir: formData.get('repoDir') as string,
            aiMessage: this.aiMessageEditor?.getValue() || ''
        };

        try {
            await window.electronAPI.startConversion(data);
            console.log('変換が完了しました');
            // ここでユーザーに成功メッセージを表示できます
        } catch (error) {
            console.error('変換中にエラーが発生しました:', error);
            // ここでユーザーにエラーメッセージを表示できます
        } finally {
            this.submitButton.disabled = false;
            this.submitButton.textContent = '変換開始';
        }
    }
}