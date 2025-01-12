const { app, BrowserWindow, ipcMain } = require('electron');
const axios = require('axios');
const cheerio = require('cheerio');
require('@electron/remote/main').initialize();
const path = require('path');
const isDev = require('electron-is-dev');

// 将 IPC 处理程序移到这里，确保在应用启动前注册
ipcMain.handle('fetch-page', async (event, url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000 // 添加超时设置
    });

    const $ = cheerio.load(response.data);

    // 移除不需要的元素
    $('script, style, iframe, nav, footer, header, aside').remove();

    // 尝试获取主要内容
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.main-content',
      '#main-content',
      '.content',
      '#content'
    ];

    let mainContent = '';
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        mainContent = element.text();
        break;
      }
    }

    // 如果没有找到主要内容，使用 body
    if (!mainContent) {
      mainContent = $('body').text();
    }

    // 清理文本
    return mainContent
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000);
  } catch (error) {
    console.error('Error fetching page:', error);
    throw new Error(`Failed to fetch page: ${error.message}`);
  }
});

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);
  console.log('Preload script exists:', require('fs').existsSync(preloadPath));

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
      preload: preloadPath,
      webSecurity: isDev ? false : true,
      devTools: isDev
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded');
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload error:', { preloadPath, error });
  });

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  console.log('Loading URL:', startURL);

  mainWindow.loadURL(startURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  require('@electron/remote/main').enable(mainWindow.webContents);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 