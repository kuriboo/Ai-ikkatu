import { Settings } from '../../shared/types';

export class SettingsForm {
  private container: HTMLElement;
  private form: HTMLFormElement = document.createElement('form'); // 初期化を追加
  private saveButton!: HTMLButtonElement; // 非nullアサーションを追加
  private statusMessage!: HTMLElement; // 非nullアサーションを追加

  constructor(container: HTMLElement) {
      this.container = container;
      this.createForm();
      this.attachEventListeners();
      this.loadSettings();
  }

  private createForm() {
      this.form = document.createElement('form');
      this.form.className = 'bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4';
      this.form.innerHTML = `
          <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="driveCredentials">
                  Google Drive API認証情報（JSON）
              </label>
              <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="driveCredentials" name="driveCredentials" rows="4" placeholder='{"installed":{"client_id":"...","project_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_secret":"...","redirect_uris":["..."]}}' required></textarea>
          </div>
          <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="anthropicKey">
                  Anthropic APIキー
              </label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="anthropicKey" name="anthropicKey" type="password" placeholder="sk-ant-api03-..." required>
          </div>
          <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="githubToken">
                  GitHubアクセストークン
              </label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="githubToken" name="githubToken" type="password" placeholder="ghp_..." required>
          </div>
          <div class="mb-6">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="githubOwner">
                  GitHubオーナー名
              </label>
              <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="githubOwner" name="githubOwner" type="text" placeholder="your-github-username" required>
          </div>
          <div class="flex items-center justify-between">
              <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                  設定を保存
              </button>
              <span id="statusMessage" class="text-sm"></span>
          </div>
      `;
      this.container.appendChild(this.form);
      this.saveButton = this.form.querySelector('button[type="submit"]') as HTMLButtonElement;
      this.statusMessage = this.form.querySelector('#statusMessage') as HTMLElement;
  }

  private attachEventListeners() {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  private async loadSettings() {
      try {
          const settings = await window.electronAPI.loadSettings();
          this.populateForm(settings);
      } catch (error) {
          console.error('設定の読み込みに失敗しました:', error);
          this.showStatus('設定の読み込みに失敗しました', 'error');
      }
  }

  private populateForm(settings: Settings) {
      const elements = this.form.elements as any;
      elements.driveCredentials.value = settings.driveCredentials || '';
      elements.anthropicKey.value = settings.anthropicKey || '';
      elements.githubToken.value = settings.githubToken || '';
      elements.githubOwner.value = settings.githubOwner || '';
  }

  private async handleSubmit(event: Event) {
      event.preventDefault();
      this.saveButton.disabled = true;
      this.saveButton.textContent = '保存中...';

      const formData = new FormData(this.form);
      const settings: Settings = {
          driveCredentials: formData.get('driveCredentials') as string,
          anthropicKey: formData.get('anthropicKey') as string,
          githubToken: formData.get('githubToken') as string,
          githubOwner: formData.get('githubOwner') as string
      };

      try {
          await window.electronAPI.saveSettings(settings);
          this.showStatus('設定が保存されました', 'success');
      } catch (error) {
          console.error('設定の保存に失敗しました:', error);
          this.showStatus('設定の保存に失敗しました', 'error');
      } finally {
          this.saveButton.disabled = false;
          this.saveButton.textContent = '設定を保存';
      }
  }

  private showStatus(message: string, type: 'success' | 'error') {
      this.statusMessage.textContent = message;
      this.statusMessage.className = type === 'success' ? 'text-green-600' : 'text-red-600';
      setTimeout(() => {
          this.statusMessage.textContent = '';
      }, 3000);
  }
}