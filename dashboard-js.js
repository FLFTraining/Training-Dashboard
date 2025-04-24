document.addEventListener('DOMContentLoaded', function() {
  // Initialize variables
  let trainingData = [];
  const today = new Date();
  const todayFormatted = formatDate(today);
  let selectedDateStart = todayFormatted;
  let selectedDateEnd = todayFormatted;
  
  // Set formatted dates
  document.getElementById('generation-date').textContent = formatDisplayDate(today);
  
  // Initialize date inputs
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  startDateInput.value = todayFormatted;
  endDateInput.value = todayFormatted;
  
  // Load CSV data
  loadTrainingData();
  
  // Tab navigation
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Update button styles
      tabButtons.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200');
      });
      this.classList.remove('bg-gray-200');
      this.classList.add('bg-blue-600', 'text-white');
      
      // Hide all tab panels
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.add('hidden');
      });
      
      // Show selected tab panel
      document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    });
  });
  
  // Date range toggle
  document.getElementById('today-btn').addEventListener('click', function() {
    this.classList.remove('bg-gray-200');
    this.classList.add('bg-blue-600', 'text-white');
    document.getElementById('custom-range-btn').classList.remove('bg-blue-600', 'text-white');
    document.getElementById('custom-range-btn').classList.add('bg-gray-200');
    document.getElementById('date-range-inputs').classList.add('hidden');
    
    // Reset to today
    selectedDateStart = todayFormatted;
    selectedDateEnd = todayFormatted;
    
    // Update dashboard
    updateDashboard();
  });
  
  document.getElementById('custom-range-btn').addEventListener('click', function() {
    this.classList.remove('bg-gray-200');
    this.classList.add('bg-blue-600', 'text-white');
    document.getElementById('today-btn').classList.remove('bg-blue-600', 'text-white');
    document.getElementById('today-btn').classList.add('bg-gray-200');
    document.getElementById('date-range-inputs').classList.remove('hidden');
  });
  
  document.getElementById('apply-date-range').addEventListener('click', function() {
    selectedDateStart = startDateInput.value;
    selectedDateEnd = endDateInput.value;
    
    // Update dashboard
    updateDashboard();
  });
  
  // Department selection
  document.getElementById('department-select').addEventListener('change', function() {
    const selectedDept = this.value;
    if (selectedDept) {
      document.getElementById('department-details').classList.remove('hidden');
      document.getElementById('selected-department-name').textContent = selectedDept + ' Department Details';
      updateDepartmentDetails(selectedDept);
    } else {
      document.getElementById('department-details').classList.add('hidden');
    }
  });
  
  // Individual tab filters
  document.getElementById('name-filter').addEventListener('input', function() {
    updateIndividualTable();
  });
  
  document.getElementById('individual-department-filter').addEventListener('change', function() {
    updateIndividualTable();
  });
  
  // Load training data from CSV
  function loadTrainingData() {
    document.getElementById('loading').classList.remove('hidden');
    
    Papa.parse('FLF_Daily_Training_Data_April22_2025.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function(results) {
        trainingData = results.data;
        
        // Initialize dashboard with data
        initializeDashboard();
        
        // Hide loading indicator
        document.getElementById('loading').classList.add('hidden');
      },
      error: function(error) {
        console.error('Error loading CSV data:', error);
        document.getElementById('loading').innerHTML = '<p class="text-red-500">Error loading data. Please check console for details.</p>';
      }
    });
  }
  
  function initializeDashboard() {
    // Update date display
    document.getElementById('date-display').textContent = 'Daily Training Report - ' + formatDisplayDate(today);
    
    // Populate department dropdowns
    populateDepartmentDropdowns();
    
    // Set default tab to summary
    document.querySelector('[data-tab="summary"]').click();
    
    // Update dashboard with data
    updateDashboard();
  }
  
  function updateDashboard() {
    // Filter data by selected date range
    const filteredData = filterDataByDateRange(trainingData, selectedDateStart, selectedDateEnd);
    
    // Update date range display
    if (selectedDateStart === selectedDateEnd) {
      document.getElementById('date-display').textContent = 'Daily Training Report - ' + formatDisplayDate(new Date(selectedDateStart));
    } else {
      document.getElementById('date-display').textContent = `Training Report - ${formatDisplayDate(new Date(selectedDateStart))} to ${formatDisplayDate(new Date(selectedDateEnd))}`;
    }
    
    // Update KPI summary cards
    updateKPISummary(filteredData);
    
    // Update summary tab
    updateSummaryTab(filteredData);
    
    // Update courses tab
    updateCoursesTab(filteredData);
    
    // Update departments tab
    updateDepartmentsTab(filteredData);
    
    // Update individual tab
    updateIndividualTab(filteredData);
  }
  
  function filterDataByDateRange(data, startDate, endDate) {
    // Convert string dates to Date objects for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set hours to ensure full day comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return data.filter(item => {
      const enrollDate = item['Enrolled on'] ? new Date(item['Enrolled on']) : null;
      
      // Include items within the date range or if no enrollment date (treat as current)
      return !enrollDate || (enrollDate >= start && enrollDate <= end);
    });
  }
  
  function updateKPISummary(data) {
    // Calculate KPIs
    const courses = [...new Set(data.map(item => item.Course))];
    const totalAssignments = data.length;
    const completed = data.filter(item => item['Content Status'] === 'Completed').length;
    const complianceRate = totalAssignments > 0 ? ((completed / totalAssignments) * 100).toFixed(1) : '0.0';
    
    // Calculate average score for completed courses
    const completedWithScores = data.filter(item => 
      item['Content Status'] === 'Completed' && 
      item['Average score'] !== null && 
      item['Average score'] !== undefined
    );
    
    let avgScore = '0.0';
    if (completedWithScores.length > 0) {
      const totalScore = completedWithScores.reduce((sum, item) => sum + item['Average score'], 0);
      avgScore = (totalScore / completedWithScores.length).toFixed(1);
    }
    
    // Update KPI cards
    document.getElementById('total-courses').textContent = courses.length;
    document.getElementById('total-assignments').textContent = totalAssignments;
    document.getElementById('total-completed').textContent = completed;
    document.getElementById('compliance-rate').textContent = complianceRate + '%';
    document.getElementById('avg-score').textContent = avgScore;
  }
  
  function updateSummaryTab(data) {
    // Group by course
    const coursesSummary = [];
    const courseGroups = groupBy(data, 'Course');
    
    for (const [courseName, courseData] of Object.entries(courseGroups)) {
      const totalAssigned = courseData.length;
      const completed = courseData.filter(item => item['Content Status'] === 'Completed').length;
      const compliance = totalAssigned > 0 ? (completed / totalAssigned * 100).toFixed(1) : '0.0';
      
      // Calculate average score
      const completedWithScores = courseData.filter(item => 
        item['Content Status'] === 'Completed' && 
        item['Average score'] !== null && 
        item['Aver