document.addEventListener('DOMContentLoaded', async () => {
  const salaryForm = document.getElementById('salary-form');
  const annualSalaryInput = document.getElementById('annual-salary');
  const workStartInput = document.getElementById('work-start');
  const workEndInput = document.getElementById('work-end');
  const earningsDisplay = document.getElementById('earnings-display');
  const autoLaunchCheckbox = document.getElementById('auto-launch');
  const dailyIncomeDisplay = document.getElementById('daily-income-display');
  
  // Load saved values
  const savedInfo = await window.salaryAPI.getSalaryInfo();
  annualSalaryInput.value = savedInfo.annualSalary;
  workStartInput.value = savedInfo.workStart;
  workEndInput.value = savedInfo.workEnd;
  
  // Load auto-launch setting
  const autoLaunchEnabled = await window.salaryAPI.getAutoLaunch();
  if (autoLaunchCheckbox) {
    autoLaunchCheckbox.checked = autoLaunchEnabled;
    
    // Add event listener for auto-launch checkbox
    autoLaunchCheckbox.addEventListener('change', async (e) => {
      await window.salaryAPI.setAutoLaunch(e.target.checked);
    });
  }
  
  // Update earnings display
  function updateEarningsDisplay() {
    // This is just for display in the app window
    // The actual calculation happens in the main process
    const annualSalary = parseFloat(annualSalaryInput.value);
    const workStart = workStartInput.value;
    const workEnd = workEndInput.value;
    
    if (!annualSalary || !workStart || !workEnd) return;
    
    const now = new Date();
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
    
    // Update daily income display
    dailyIncomeDisplay.textContent = dailySalary.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Calculate salary per minute
    const salaryPerMinute = dailySalary / totalWorkMinutes;
    
    // Calculate how much earned so far today
    let earnedToday = 0;
    
    if (currentTimeInMinutes < workStartInMinutes) {
      // Before work starts
      earnedToday = 0;
    } else if (currentTimeInMinutes > workEndInMinutes) {
      // After work ends
      earnedToday = dailySalary;
    } else {
      // During work hours
      const minutesWorked = currentTimeInMinutes - workStartInMinutes;
      earnedToday = minutesWorked * salaryPerMinute;
    }
    
    // Format as currency
    earningsDisplay.textContent = earnedToday.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Update earnings display every 200ms (5 times per second)
  setInterval(updateEarningsDisplay, 200);
  
  // Handle form submission
  salaryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      annualSalary: parseFloat(annualSalaryInput.value),
      workStart: workStartInput.value,
      workEnd: workEndInput.value
    };
    
    await window.salaryAPI.saveSalaryInfo(data);
    
    // Immediately update the earnings display with new values
    updateEarningsDisplay();
    
    // Show success message
    const saveButton = document.getElementById('save-button');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saved!';
    saveButton.disabled = true;
    
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 2000);
  });
});