const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('salaryAPI', {
  getSalaryInfo: () => ipcRenderer.invoke('get-salary-info'),
  saveSalaryInfo: (data) => ipcRenderer.invoke('save-salary-info', data)
});