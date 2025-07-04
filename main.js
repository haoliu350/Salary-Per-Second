const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { calculateStateTax } = require('./stateTax');
const { calculateFederalTax } = require('./federalTax');

// Prevent garbage collection
let tray = null;
let mainWindow = null;
let isQuitting = false;

// Store for saving user preferences
const store = new Store();

// Default values
const DEFAULT_ANNUAL_SALARY = 85000;
const DEFAULT_WORK_START = '09:00';
const DEFAULT_WORK_END = '17:00';
const DEFAULT_AUTO_LAUNCH = false;
const DEFAULT_STATE = 'CA';

// Auto-launch setting
function setAutoLaunch(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath
  });
  store.set('autoLaunch', enabled);
  return enabled;
}

// Check if auto-launch is enabled
function isAutoLaunchEnabled() {
  return store.get('autoLaunch', DEFAULT_AUTO_LAUNCH);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    frame: true,
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Hide dock icon
  app.dock.hide();

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
}

function createTray() {
  // Instead of creating an icon, we'll use a transparent 1x1 pixel image
  const transparentIcon = nativeImage.createEmpty();
  transparentIcon.resize({ width: 1, height: 1 });
  
  tray = new Tray(transparentIcon);
  
  tray.setToolTip('Salary Calculator');
  
  // Set title position to center
  tray.setTitle('$0.00', {
    fontType: 'monospacedDigit'
  });
  
  // tray.on('click', () => {
  //   toggleWindow();
  // });
  
  // Context menu with auto-launch option
  updateContextMenu();
}

function updateContextMenu() {
  const autoLaunchEnabled = isAutoLaunchEnabled();
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => { mainWindow.show(); } },
    { type: 'separator' },
    { 
      label: 'Start at Login', 
      type: 'checkbox',
      checked: autoLaunchEnabled,
      click: () => { 
        const newState = setAutoLaunch(!autoLaunchEnabled);
        updateContextMenu(); // Update menu to reflect new state
      } 
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { 
      isQuitting = true;
      app.quit(); 
    }}
  ]);
  
  tray.setContextMenu(contextMenu);
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

function showWindow() {
  // Get the primary display dimensions
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  const windowBounds = mainWindow.getBounds();
  
  // Calculate position to center the window on screen
  const x = Math.round((width - windowBounds.width) / 2);
  const y = Math.round((height - windowBounds.height) / 2);
  
  mainWindow.setPosition(x, y, false);
  mainWindow.show();
  mainWindow.focus();
}

// Calculate earnings based on time
function calculateEarnings() {
  const annualSalary = store.get('annualSalary', DEFAULT_ANNUAL_SALARY);
  const workStart = store.get('workStart', DEFAULT_WORK_START);
  const workEnd = store.get('workEnd', DEFAULT_WORK_END);
  const state = store.get('state', DEFAULT_STATE);
  
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 6 is Saturday
  const isWorkday = day >= 1 && day <= 5; // 1 to 5 represents Monday to Friday
  
  // If it's weekend, return zero values
  if (!isWorkday) {
    return {
      earned: '$0.00',
      taxPaid: '$0.00'
    };
  }
  
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  
  // Parse work hours
  const [startHour, startMinute] = workStart.split(':').map(Number);
  const [endHour, endMinute] = workEnd.split(':').map(Number);
  
  // Convert to minutes for easier calculation
  const workStartInMinutes = startHour * 60 + startMinute;
  const workEndInMinutes = endHour * 60 + endMinute;
  const currentTimeInMinutes = currentHours * 60 + currentMinutes + (currentSeconds / 60);
  
  // Total work minutes in a day
  const totalWorkMinutes = workEndInMinutes - workStartInMinutes;
  
  // Calculate daily salary (assuming 5 workdays per week, 52 weeks per year)
  const dailySalary = annualSalary / (5 * 52);
  
  // Calculate federal tax per day
  const annualFederalTax = calculateFederalTax(annualSalary);
  const dailyFederalTax = annualFederalTax / (5 * 52);

  // Calculate state tax per day
  const annualStateTax = calculateStateTax(annualSalary, state);
  const dailyStateTax = annualStateTax / (5 * 52);

  // Calculate salary per minute (after state tax)
  const dailyAfterTax = dailySalary - dailyFederalTax - dailyStateTax;
  const salaryPerMinute = dailyAfterTax / totalWorkMinutes;

  // Calculate tax per minute
  const taxTotalPerMinute = (dailyFederalTax + dailyStateTax) / totalWorkMinutes;
  
  // Calculate how much earned so far today
  let earnedToday = 0;
  
  if (currentTimeInMinutes < workStartInMinutes) {
    // Before work starts
    earnedToday = 0;
  } else if (currentTimeInMinutes > workEndInMinutes) {
    // After work ends
    earnedToday = dailyAfterTax;  // Changed from dailySalary to dailyAfterTax
  } else {
    // During work hours
    const minutesWorked = currentTimeInMinutes - workStartInMinutes;
    earnedToday = minutesWorked * salaryPerMinute;
  }

  // Calculate how much tax paied so far today
  let taxPaidToday = 0;
  
  if (currentTimeInMinutes < workStartInMinutes) {
    // Before work starts
    taxPaidToday = 0;
  } else if (currentTimeInMinutes > workEndInMinutes) {
    // After work ends
    taxPaidToday = dailyFederalTax + dailyStateTax;
  } else {
    // During work hours
    const minutesWorked = currentTimeInMinutes - workStartInMinutes;
    taxPaidToday = minutesWorked * taxTotalPerMinute;
  }
  
  // Format both values as currency
  return {
    earned: earnedToday.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    taxPaid: taxPaidToday.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  };
}

// Update the tray title with current earnings
function updateTrayTitle() {
  const { earned, taxPaid } = calculateEarnings();
  tray.setTitle(earned, {
    fontType: 'monospacedDigit'
  });
}

// Add at the top of the file after the requires
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Modify the app.whenReady() section
app.whenReady().then(() => {
  try {
    createTray();
    createWindow();
    
    // Set auto-launch based on stored preference
    setAutoLaunch(isAutoLaunchEnabled());
    
    // Update tray title 1 times per second (1000ms)
    setInterval(updateTrayTitle, 1000);
  } catch (error) {
    console.error('Error during initialization:', error);
  }
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// IPC handlers for communication with renderer
ipcMain.handle('get-salary-info', () => {
  const salary = store.get('annualSalary', DEFAULT_ANNUAL_SALARY);
  return {
    annualSalary: salary.toLocaleString('en-US'), // Format the number with commas
    workStart: store.get('workStart', DEFAULT_WORK_START),
    workEnd: store.get('workEnd', DEFAULT_WORK_END),
    state: store.get('state', DEFAULT_STATE)
  };
});

ipcMain.handle('save-salary-info', (event, data) => {
  store.set('annualSalary', parseFloat(data.annualSalary)); // Ensure we store a number
  store.set('workStart', data.workStart);
  store.set('workEnd', data.workEnd);
  store.set('state', data.state);
  return true;
});

// Add IPC handler for auto-launch setting
ipcMain.handle('get-auto-launch', () => {
  return isAutoLaunchEnabled();
});

ipcMain.handle('set-auto-launch', (event, enabled) => {
  return setAutoLaunch(enabled);
});

// Add this with your other IPC handlers
ipcMain.handle('calculate-taxes', (event, { salary, state }) => {
  return {
    federal: calculateFederalTax(salary),
    state: calculateStateTax(salary, state)
  };
});