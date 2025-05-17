document.addEventListener('DOMContentLoaded', async () => {
  const salaryForm = document.getElementById('salary-form');
  
  // Format salary input
  const annualSalaryInput = document.getElementById('annual-salary');
  
  function formatSalary(value) {
    // Remove any non-digit characters
    const number = value.replace(/\D/g, '');
    // Format with commas
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  annualSalaryInput.addEventListener('input', (e) => {
    const cursorPosition = e.target.selectionStart;
    const unformattedValue = e.target.value.replace(/,/g, '');
    const formattedValue = formatSalary(unformattedValue);
    e.target.value = formattedValue;
    
    // Restore cursor position
    const addedCommas = (formattedValue.match(/,/g) || []).length;
    const previousCommas = (e.target.value.substring(0, cursorPosition).match(/,/g) || []).length;
    e.target.setSelectionRange(cursorPosition + addedCommas - previousCommas, cursorPosition + addedCommas - previousCommas);
  });

  // When using the value for calculations, remember to remove commas
  function getNumericValue(value) {
    return parseFloat(value.replace(/,/g, '')) || 0;
  }
  const workStartInput = document.getElementById('work-start');
  const workEndInput = document.getElementById('work-end');
  const stateSelect = document.getElementById('state');
  const earningsDisplay = document.getElementById('earnings-display');
  const autoLaunchCheckbox = document.getElementById('auto-launch');
  const dailyIncomeDisplay = document.getElementById('daily-income-display');
  const taxPaidDisplay = document.getElementById('tax-paid-display');
  
  // Load saved values
  const savedInfo = await window.salaryAPI.getSalaryInfo();
  annualSalaryInput.value = savedInfo.annualSalary;
  workStartInput.value = savedInfo.workStart;
  workEndInput.value = savedInfo.workEnd;
  stateSelect.value = savedInfo.state?.toLowerCase() || 'california';
  
  // Load auto-launch setting
  const autoLaunchEnabled = await window.salaryAPI.getAutoLaunch();
  if (autoLaunchCheckbox) {
    autoLaunchCheckbox.checked = autoLaunchEnabled;
    
    // Add event listener for auto-launch checkbox
    autoLaunchCheckbox.addEventListener('change', async (e) => {
      await window.salaryAPI.setAutoLaunch(e.target.checked);
    });
  }
  
  // Get initial tax calculations
  let currentTaxes = { federal: 0, state: 0 };
  
  async function updateTaxes() {
    const annualSalary = getNumericValue(annualSalaryInput.value);
    const state = stateSelect.value;
    if (annualSalary && state) {
      currentTaxes = await window.salaryAPI.calculateTaxes(annualSalary, state);
    }
    return currentTaxes;
  }
  
  // Initial tax calculation
  await updateTaxes();
  
  // Update earnings display
  // Update your updateEarningsDisplay function to use getNumericValue
  function updateEarningsDisplay() {
    const annualSalary = getNumericValue(annualSalaryInput.value);
    const workStart = workStartInput.value;
    const workEnd = workEndInput.value;
    
    if (!annualSalary || !workStart || !workEnd) return;
    
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 6 is Saturday
    const isWorkday = day >= 1 && day <= 5; // 1 to 5 represents Monday to Friday
    
    // If it's weekend, display zero values
    if (!isWorkday) {
      
      const totalBox = document.querySelector('.total-box');
      totalBox.title = 'Pre-tax deductions not counted (e.g., Social Security, 401K, Medical).';

      const earningBox = document.querySelector('.earning-box');
      earningBox.title = `How much you earned today: 100%`;

      const taxBox = document.querySelector('.tax-box');
      taxBox.title = `Federal: $0 and State: $0`;

      earningsDisplay.textContent = '$0.00';
      dailyIncomeDisplay.textContent = '$0.00';
      taxPaidDisplay.textContent = '$0.00';
      return;
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
    
    // Update daily income display
    dailyIncomeDisplay.textContent = dailySalary.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Calculate federal and state tax per day
    const annualFederalTax = currentTaxes.federal;
    const annualStateTax = currentTaxes.state;
    const dailyTotalTax = (annualFederalTax + annualStateTax) / (5 * 52);
    const taxPerMinute = dailyTotalTax / totalWorkMinutes;

    // Calculate salary per minute (after tax)
    const dailyAfterTax = dailySalary - dailyTotalTax;
    const salaryPerMinute = dailyAfterTax / totalWorkMinutes;
    
    // Calculate earnings and tax paid so far today
    let earnedToday = 0;
    let taxPaidToday = 0;
    
    if (currentTimeInMinutes < workStartInMinutes) {
      // Before work starts
      earnedToday = 0;
      taxPaidToday = 0;
    } else if (currentTimeInMinutes > workEndInMinutes) {
      // After work ends
      earnedToday = dailyAfterTax;
      taxPaidToday = dailyTotalTax;
    } else {
      // During work hours
      const minutesWorked = currentTimeInMinutes - workStartInMinutes;
      earnedToday = minutesWorked * salaryPerMinute;
      taxPaidToday = minutesWorked * taxPerMinute;
    }
  
    const totalBox = document.querySelector('.total-box');
    totalBox.title = 'Pre-tax deductions not counted (e.g., Social Security, 401K, Medical).';

    const earningBox = document.querySelector('.earning-box');
    const earnedPercent = Number(((earnedToday / dailyAfterTax) * 100).toFixed(2));
    earningBox.title = `How much you earned today: ${earnedPercent}%`;

    // Format and display values
    earningsDisplay.textContent = earnedToday.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Update tax display and tooltip
    const taxBox = document.querySelector('.tax-box');
    const federalTaxFormatted = (annualFederalTax / (5 * 52)).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const stateTaxFormatted = (annualStateTax / (5 * 52)).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    taxBox.title = `Federal: ${federalTaxFormatted} and State: ${stateTaxFormatted}`;
    
    taxPaidDisplay.textContent = taxPaidToday.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Update earnings display every second
  setInterval(updateEarningsDisplay, 1000);
  
  // Handle form submission
  salaryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      annualSalary: getNumericValue(annualSalaryInput.value), // Use getNumericValue to remove commas
      workStart: workStartInput.value,
      workEnd: workEndInput.value,
      state: stateSelect.value
    };
    
    await window.salaryAPI.saveSalaryInfo(data);
    
    // Update tax calculations after saving
    await updateTaxes();
    
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