const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('salaryAPI', {
  getSalaryInfo: () => ipcRenderer.invoke('get-salary-info'),
  saveSalaryInfo: (data) => ipcRenderer.invoke('save-salary-info', data),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('set-auto-launch', enabled),
  calculateTaxes: (salary, state) => ipcRenderer.invoke('calculate-taxes', { salary, state })
});