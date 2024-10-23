export class LogViewer {
  private container: HTMLElement;
  private logContainer: HTMLElement = document.createElement('div'); // 初期化を追加

  constructor(container: HTMLElement) {
      this.container = container;
      this.createLogViewer();
      this.attachEventListeners();
  }

  private createLogViewer() {
      this.container.innerHTML = `
          <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <h2 class="text-xl font-bold mb-4">ログ</h2>
              <div id="logContainer" class="bg-gray-100 p-4 h-64 overflow-y-auto"></div>
          </div>
      `;
      this.logContainer = this.container.querySelector('#logContainer') as HTMLElement;
  }

  private attachEventListeners() {
      // ここでグローバルイベントリスナーを設定できます（必要な場合）
  }

  public addLog(message: string) {
      const logEntry = document.createElement('p');
      logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
      logEntry.className = 'mb-2';
      this.logContainer.appendChild(logEntry);
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  public clearLogs() {
      this.logContainer.innerHTML = '';
  }
}