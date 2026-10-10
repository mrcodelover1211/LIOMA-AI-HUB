const { app, BrowserWindow, ipcMain, safeStorage, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

let mainWindow;
const keyFile = () => path.join(app.getPath('userData'), 'groq-key.enc');

async function readApiKey() {
  try {
    const encrypted = await fs.readFile(keyFile());
    if (!safeStorage.isEncryptionAvailable()) {
      return { configured: false, secureStorageAvailable: false };
    }
    return {
      configured: true,
      secureStorageAvailable: true,
      apiKey: safeStorage.decryptString(encrypted)
    };
  } catch {
    return { configured: false, secureStorageAvailable: safeStorage.isEncryptionAvailable() };
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#10131d',
    title: 'Lioma Agent Hub',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL || (!app.isPackaged ? 'http://127.0.0.1:5173' : null);
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  ipcMain.handle('lioma:key-status', async () => {
    const result = await readApiKey();
    return { configured: result.configured, secureStorageAvailable: result.secureStorageAvailable };
  });

  ipcMain.handle('lioma:save-key', async (_event, rawKey) => {
    if (typeof rawKey !== 'string' || !rawKey.trim()) {
      return { ok: false, error: 'Enter a valid API key.' };
    }
    if (!safeStorage.isEncryptionAvailable()) {
      return { ok: false, error: 'Secure OS storage is unavailable. Lioma will not save the key insecurely. Check your Windows account and try again.' };
    }
    const encrypted = safeStorage.encryptString(rawKey.trim());
    await fs.writeFile(keyFile(), encrypted, { mode: 0o600 });
    return { ok: true };
  });

  ipcMain.handle('lioma:chat', async (_event, payload) => {
    const stored = await readApiKey();
    if (!stored.apiKey) return { ok: false, error: 'Groq API key is not configured.' };
    const { message, mode, history = [] } = payload || {};
    if (typeof message !== 'string' || !message.trim()) return { ok: false, error: 'Message is empty.' };

    const model = 'openai/gpt-oss-120b';
    const modeInstructions = {
      Shopping: 'You are Lioma Shopping Agent. Compare real products carefully. Do not invent prices, links, stock or compatibility. State uncertainty and require user approval before any purchase.',
      Research: 'You are Lioma Research Agent. Separate verified facts from uncertainty and provide sources when tools provide them. Do not pretend to browse if no search tool is connected.',
      Aviation: 'You are Lioma Aviation Agent. Help with flight simulation and aviation research. Distinguish simulation advice from real-world operational guidance.',
      Builder: 'You are Lioma Builder Agent. Help design and implement software with concrete, testable steps.',
      'Browser Agent': 'You are Lioma Browser Agent. Plan browser tasks but do not claim to control a browser until a local automation service is connected. Require confirmation for purchases, destructive actions, or sending data.',
      'General Assistant': 'You are Lioma, a helpful general-purpose AI assistant.'
    };
    const messages = [
      { role: 'system', content: (modeInstructions[mode] || modeInstructions['General Assistant']) + '\nYou are running inside Lioma Agent Hub. Be honest about tools and capabilities.' },
      ...history.slice(-12).filter(m => m && ['user','assistant'].includes(m.role)).map(m => ({ role: m.role, content: String(m.content).slice(0, 12000) })),
      { role: 'user', content: message }
    ];

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stored.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.4 })
      });
      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data?.error?.message || `Groq API error (${response.status}).` };
      }
      return { ok: true, text: data?.choices?.[0]?.message?.content || '(No response text returned.)', model };
    } catch (error) {
      return { ok: false, error: `Network error: ${error.message}` };
    }
  });

  ipcMain.handle('lioma:open-external', async (_event, url) => {
    if (typeof url !== 'string' || !/^https:\/\/(console\.groq\.com|supabase\.com|playwright\.dev)\//.test(url)) {
      return { ok: false };
    }
    await shell.openExternal(url);
    return { ok: true };
  });

  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });