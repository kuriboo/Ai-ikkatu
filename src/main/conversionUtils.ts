import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { Anthropic } from '@anthropic-ai/sdk';
//import { Octokit } from '@octokit/rest';
import { Settings } from '../shared/types';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

async function listAllFiles(folderId: string, auth: GoogleAuth): Promise<DriveFile[]> {
  const drive = google.drive({ version: 'v3', auth });
  const allFiles: DriveFile[] = [];

  async function getFiles(parentId: string) {
    let pageToken: string | undefined;
    do {
      const res = await drive.files.list({
        q: `'${parentId}' in parents`,
        fields: 'nextPageToken, files(id, name, mimeType)',
        pageToken: pageToken,
      });

      const files = res.data.files;
      if (files) {
        for (const file of files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            await getFiles(file.id!);
          } else if (file.mimeType!.startsWith('image/') || file.mimeType === 'text/plain') {
            allFiles.push(file as DriveFile);
          }
        }
      }

      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  await getFiles(folderId);
  return allFiles;
}

async function downloadFile(fileId: string, auth: GoogleAuth): Promise<Buffer> {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

async function convertToNextJS(fileContent: Buffer, fileName: string, aiMessage: string, anthropicApiKey: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  const base64Content = fileContent.toString('base64');
  const mimeType = getImageMimeType(fileContent);

  const response = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${aiMessage}\n\nファイル名: ${fileName}\n\n上記の内容を元に、Next.js + React + TypeScriptのコンポーネントを生成してください。`
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type:  mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64Content
            }
          }
        ]
      }
    ]
  });

  return response.content.map(block => block.type === 'text' ? block.text : '').join('');
}

function getImageMimeType(buffer: Buffer): string {
  const signatures: { [key: string]: string } = {
    'ffd8ffe0': 'image/jpeg',
    '89504e47': 'image/png',
    '47494638': 'image/gif',
    '52494646': 'image/webp',
    '424d': 'image/bmp',
  };

  const hex = buffer.toString('hex', 0, 4);
  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (hex.startsWith(signature)) {
      return mimeType;
    }
  }

  // テキストファイルの場合
  if (buffer.toString().trim().length > 0) {
    return 'text/plain';
  }

  return 'application/octet-stream';
}

async function pushToGitHub(repoName: string, filePath: string, content: string, settings: Settings): Promise<void> {
  const { Octokit } = await import('@octokit/rest');
  const octokit = new Octokit({ auth: settings.githubToken });

  try {
    const { data: repo } = await octokit.repos.get({
      owner: settings.githubOwner,
      repo: repoName,
    });

    const { data: reference } = await octokit.git.getRef({
      owner: settings.githubOwner,
      repo: repoName,
      ref: `heads/${repo.default_branch}`,
    });

    const { data: commit } = await octokit.git.getCommit({
      owner: settings.githubOwner,
      repo: repoName,
      commit_sha: reference.object.sha,
    });

    const { data: blobData } = await octokit.git.createBlob({
      owner: settings.githubOwner,
      repo: repoName,
      content: Buffer.from(content).toString('base64'),
      encoding: 'base64',
    });

    const { data: tree } = await octokit.git.createTree({
      owner: settings.githubOwner,
      repo: repoName,
      base_tree: commit.tree.sha,
      tree: [
        {
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        },
      ],
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner: settings.githubOwner,
      repo: repoName,
      message: `Add ${filePath}`,
      tree: tree.sha,
      parents: [commit.sha],
    });

    await octokit.git.updateRef({
      owner: settings.githubOwner,
      repo: repoName,
      ref: `heads/${repo.default_branch}`,
      sha: newCommit.sha,
    });

    console.log(`${filePath} が正常にGitHubにプッシュされました。`);
  } catch (error) {
    console.error(`${filePath} のGitHubへのプッシュに失敗しました:`, error);
    throw error;
  }
}

export async function convertFiles(
  folderId: string,
  repoName: string,
  repoDir: string,
  aiMessage: string,
  settings: Settings,
  logCallback: (message: string) => void
): Promise<void> {
  const auth = new GoogleAuth({
    credentials: JSON.parse(settings.driveCredentials),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const files = await listAllFiles(folderId, auth);
  logCallback(`処理対象のファイルが${files.length}個見つかりました。`);

  for (const file of files) {
    try {
      logCallback(`処理中: ${file.name}`);
      const fileContent = await downloadFile(file.id, auth);
      const mimeType = getImageMimeType(fileContent);

      if (mimeType === 'application/octet-stream') {
        logCallback(`${file.name}は有効な画像ファイルまたはテキストファイルではありません。スキップします。`);
        continue;
      }

      const nextjsCode = await convertToNextJS(fileContent, file.name, aiMessage, settings.anthropicKey);
      const fileName = `${file.name.split('.')[0]}.tsx`;
      const filePath = `${repoDir}/${fileName}`;

      await pushToGitHub(repoName, filePath, nextjsCode, settings);
      logCallback(`${fileName}の処理が完了し、GitHubにプッシュされました。`);
    } catch (error) {
      logCallback(`${file.name}の処理中にエラーが発生しました: ${(error as Error).message}`);
    }
  }
}