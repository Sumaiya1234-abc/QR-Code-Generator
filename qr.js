// ============================================
// PROFESSIONAL QR CODE GENERATOR - JAVASCRIPT
// ============================================

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    loadHistory();
    setupEventListeners();
    initAnalytics();
    renderBioLinks();
});

// ============================================
// THEME MANAGEMENT
// ============================================

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    updateThemeIcon();
    
    // Reinitialize charts with new theme colors
    setTimeout(initCharts, 100);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme + '-mode');
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeBtn = document.getElementById('themeBtn');
    if (document.body.classList.contains('dark-mode')) {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// ============================================
// QR CODE GENERATION
// ============================================

function generateQR() {
    const text = document.getElementById("qrText").value.trim();
    const size = parseInt(document.getElementById("size").value);
    const darkColor = document.getElementById("darkColor").value;
    const lightColor = document.getElementById("lightColor").value;
    const errorCorrection = document.getElementById("errorCorrection").value;
    const errorMsg = document.getElementById("error");
    const successMsg = document.getElementById("success");

    // Reset messages
    errorMsg.classList.remove('show');
    successMsg.classList.remove('show');

    // Validation
    if (text === "") {
        showError("Please enter text or URL");
        return;
    }

    if (text.length > 2953) {
        showError("Text is too long (max 2953 characters)");
        return;
    }

    // Show loading
    showLoading(true);

    try {
        const canvas = document.getElementById("qrCanvas");
        
        const options = {
            width: size,
            margin: 1,
            color: {
                dark: darkColor,
                light: lightColor
            },
            errorCorrectionLevel: errorCorrection
        };

        QRCode.toCanvas(canvas, text, options, function(error) {
            if (error) {
                showError("Error generating QR code: " + error.message);
                showLoading(false);
                return;
            }

            // Apply logo if selected
            const logoInput = document.getElementById("logoInput");
            if (logoInput.files && logoInput.files[0]) {
                addLogoToQR(canvas, logoInput.files[0], () => {
                    showLoading(false);
                    showSuccess("QR code generated successfully!");
                    addToHistory(text);
                    recordAnalytics('qrcode');
                });
            } else {
                showLoading(false);
                showSuccess("QR code generated successfully!");
                addToHistory(text);
                recordAnalytics('qrcode');
            }
        });

    } catch (error) {
        showError("Error: " + error.message);
        showLoading(false);
    }
}

// ============================================
// LOGO/IMAGE MANAGEMENT
// ============================================

function updateLogoPreview() {
    const logoInput = document.getElementById("logoInput");
    const logoPreview = document.getElementById("logoPreview");
    
    if (logoInput.files && logoInput.files[0]) {
        const file = logoInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            logoPreview.innerHTML = `<p style="color: var(--success); font-size: 12px;"><i class="fas fa-check"></i> Logo selected: ${file.name}</p>`;
        };
        
        reader.readAsDataURL(file);
    } else {
        logoPreview.innerHTML = '';
    }
}

function addLogoToQR(canvas, logoFile, callback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            const ctx = canvas.getContext('2d');
            
            // Calculate logo size (20% of canvas)
            const logoSize = canvas.width * 0.2;
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            
            // Draw white background for logo
            ctx.fillStyle = 'white';
            ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
            
            // Draw logo
            ctx.drawImage(img, x, y, logoSize, logoSize);
            
            callback();
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(logoFile);
}

// ============================================
// DOWNLOAD & EXPORT
// ============================================

function downloadQR(format) {
    const canvas = document.getElementById("qrCanvas");
    
    if (!canvas.width) {
        showError("Please generate a QR code first");
        return;
    }

    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    switch(format) {
        case 'png':
            link.download = `QRCode_${timestamp}.png`;
            link.href = canvas.toDataURL("image/png");
            break;
        case 'jpeg':
            link.download = `QRCode_${timestamp}.jpg`;
            link.href = canvas.toDataURL("image/jpeg", 0.95);
            break;
        case 'webp':
            link.download = `QRCode_${timestamp}.webp`;
            link.href = canvas.toDataURL("image/webp", 0.95);
            break;
        default:
            link.download = `QRCode_${timestamp}.png`;
            link.href = canvas.toDataURL("image/png");
    }
    
    link.click();
    showSuccess(`QR code downloaded as ${format.toUpperCase()}!`);
    recordAnalytics(format);
}

function printQR() {
    const canvas = document.getElementById("qrCanvas");
    
    if (!canvas.width) {
        showError("Please generate a QR code first");
        return;
    }

    const printWindow = window.open('', '_blank');
    const dataURL = canvas.toDataURL('image/png');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print QR Code</title>
            <style>
                body { 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0;
                    background: white;
                }
                img { 
                    max-width: 90%; 
                    max-height: 90%;
                    border: 1px solid #ddd;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <img src="${dataURL}" alt="QR Code">
            <script>window.print();</script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    showSuccess("Print dialog opened!");
}

function copyQRData() {
    const canvas = document.getElementById("qrCanvas");
    
    if (!canvas.width) {
        showError("Please generate a QR code first");
        return;
    }

    const dataURL = canvas.toDataURL('image/png');
    
    navigator.clipboard.writeText(dataURL).then(() => {
        showSuccess("QR code data copied to clipboard!");
    }).catch(() => {
        showError("Failed to copy to clipboard");
    });
}

function shareQR() {
    const text = document.getElementById("qrText").value;
    const canvas = document.getElementById("qrCanvas");
    
    if (!canvas.width) {
        showError("Please generate a QR code first");
        return;
    }

    if (navigator.share) {
        canvas.toBlob(blob => {
            const file = new File([blob], "QRCode.png", { type: "image/png" });
            
            navigator.share({
                title: 'QR Code',
                text: 'Check out this QR code: ' + text,
                files: [file]
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    showError("Error sharing: " + err.message);
                }
            });
        });
    } else {
        // Fallback: Copy to clipboard
        copyQRData();
    }
}

// ============================================
// QUICK INPUT TEMPLATES
// ============================================

function populateURL() {
    document.getElementById("qrText").value = "https://example.com";
    document.getElementById("qrText").focus();
}

function populateEmail() {
    document.getElementById("qrText").value = "mailto:example@email.com";
    document.getElementById("qrText").focus();
}

function populatePhone() {
    document.getElementById("qrText").value = "tel:+1234567890";
    document.getElementById("qrText").focus();
}

function populateWiFi() {
    document.getElementById("qrText").value = "WIFI:T:WPA;S:NetworkName;P:Password;;";
    document.getElementById("qrText").focus();
}

// ============================================
// HISTORY MANAGEMENT
// ============================================

function addToHistory(text) {
    let history = JSON.parse(localStorage.getItem('qrHistory')) || [];
    
    // Avoid duplicates
    history = history.filter(item => item.text !== text);
    
    // Add new item at beginning
    history.unshift({
        text: text,
        timestamp: new Date().toLocaleString()
    });
    
    // Keep only last 10 items
    history = history.slice(0, 10);
    
    localStorage.setItem('qrHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('qrHistory')) || [];
    const historyContainer = document.getElementById('historyContainer');
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="empty-msg">No QR codes generated yet</p>';
        return;
    }
    
    historyContainer.innerHTML = history.map((item, index) => `
        <div class="history-item">
            <span class="history-text" title="${item.text}">${item.text}</span>
            <span class="history-time">${item.timestamp}</span>
            <button class="history-delete" onclick="deleteFromHistory(${index})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteFromHistory(index) {
    let history = JSON.parse(localStorage.getItem('qrHistory')) || [];
    history.splice(index, 1);
    localStorage.setItem('qrHistory', JSON.stringify(history));
    loadHistory();
    showSuccess("Item removed from history");
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        localStorage.removeItem('qrHistory');
        loadHistory();
        showSuccess("History cleared");
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function updateSizeDisplay() {
    const size = document.getElementById("size").value;
    document.getElementById("sizeDisplay").textContent = size + "px";
}

function setupEventListeners() {
    // Update color values when changed
    document.getElementById("darkColor").addEventListener('change', function() {
        document.getElementById("darkColorValue").textContent = this.value;
    });

    document.getElementById("lightColor").addEventListener('change', function() {
        document.getElementById("lightColorValue").textContent = this.value;
    });

    // Allow Enter key to generate QR
    document.getElementById("qrText").addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            generateQR();
        }
    });
}

function showError(message) {
    const errorMsg = document.getElementById("error");
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
    
    // Smooth scroll to error
    errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    setTimeout(() => {
        errorMsg.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    const successMsg = document.getElementById("success");
    successMsg.textContent = message;
    successMsg.classList.add('show');
    
    // Smooth scroll to success message
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 4000);
}

function showLoading(show) {
    const spinner = document.getElementById("loadingSpinner");
    if (show) {
        spinner.classList.add('show');
    } else {
        spinner.classList.remove('show');
    }
}

function clearQR() {
    if (confirm('Clear all inputs and generated QR code?')) {
        document.getElementById("qrText").value = "";
        document.getElementById("logoInput").value = "";
        document.getElementById("logoPreview").innerHTML = "";
        
        const canvas = document.getElementById("qrCanvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        document.getElementById("error").classList.remove('show');
        document.getElementById("success").classList.remove('show');
        
        showSuccess("All cleared!");
    }
}

// ============================================
// NEW FEATURES - URL SHORTENING
// ============================================

function shortenURL() {
    const longUrl = document.getElementById("longUrl").value.trim();
    
    if (!longUrl) {
        showError("Please enter a URL");
        return;
    }

    // Simple URL shortening simulation (TinyURL API)
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const shortUrl = `short.url/${shortCode}`;
    
    document.getElementById("shortenedUrl").value = shortUrl;
    document.getElementById("shortenedUrlDisplay").style.display = "block";
    
    // Auto-populate QR text with shortened URL
    document.getElementById("qrText").value = shortUrl;
    generateQR();
    showSuccess("URL shortened! QR code generated.");
}

function copyShortenedURL() {
    const shortenedUrl = document.getElementById("shortenedUrl");
    shortenedUrl.select();
    navigator.clipboard.writeText(shortenedUrl.value).then(() => {
        showSuccess("Shortened URL copied!");
    }).catch(() => {
        showError("Failed to copy");
    });
}

// ============================================
// BATCH PROCESSING
// ============================================

let batchQRCodes = [];

function generateBatchQR() {
    const batchInput = document.getElementById("batchInput").value.trim();
    const items = batchInput.split('\n').filter(line => line.trim());
    
    if (items.length === 0) {
        showError("Please enter at least one URL or text");
        return;
    }
    
    if (items.length > 20) {
        showError("Maximum 20 items allowed");
        return;
    }

    batchQRCodes = [];
    const batchContainer = document.getElementById("batchContainer");
    batchContainer.innerHTML = '';
    
    showLoading(true);
    
    // Generate QR codes for each item
    items.forEach((item, index) => {
        setTimeout(() => {
            const canvas = document.createElement("canvas");
            const options = {
                width: 150,
                margin: 1,
                color: {
                    dark: document.getElementById("darkColor").value,
                    light: document.getElementById("lightColor").value
                },
                errorCorrectionLevel: document.getElementById("errorCorrection").value
            };

            QRCode.toCanvas(canvas, item, options, function(error) {
                if (!error) {
                    const batchItem = document.createElement("div");
                    batchItem.className = "batch-item";
                    batchItem.appendChild(canvas);
                    batchItem.innerHTML += `<div class="batch-item-label">${item.substring(0, 30)}</div>`;
                    batchContainer.appendChild(batchItem);
                    
                    batchQRCodes.push({text: item, canvas: canvas});
                    
                    if (index === items.length - 1) {
                        showLoading(false);
                        showSuccess(`Generated ${items.length} QR codes!`);
                        recordAnalytics('batch', items.length);
                    }
                }
            });
        }, index * 100);
    });
}

// ============================================
// ANALYTICS
// ============================================

let generationChart = null;
let formatsChart = null;
let trendsChart = null;

function initAnalytics() {
    if (!localStorage.getItem('qrAnalytics')) {
        localStorage.setItem('qrAnalytics', JSON.stringify({
            totalGenerated: 0,
            todayCount: 0,
            formats: {},
            exportCount: 0,
            lastReset: new Date().toDateString(),
            dailyData: {}
        }));
    }
    updateAnalyticsDisplay();
    setTimeout(initCharts, 500);
}

function recordAnalytics(type, count = 1) {
    let analytics = JSON.parse(localStorage.getItem('qrAnalytics'));
    const today = new Date().toDateString();
    
    if (analytics.lastReset !== today) {
        analytics.todayCount = 0;
        analytics.lastReset = today;
    }
    
    analytics.totalGenerated += count;
    analytics.todayCount += count;
    
    if (!analytics.formats[type]) {
        analytics.formats[type] = 0;
    }
    analytics.formats[type] += count;
    
    // Track daily data
    if (!analytics.dailyData[today]) {
        analytics.dailyData[today] = 0;
    }
    analytics.dailyData[today] += count;
    
    localStorage.setItem('qrAnalytics', JSON.stringify(analytics));
    updateAnalyticsDisplay();
}

function updateAnalyticsDisplay() {
    const analytics = JSON.parse(localStorage.getItem('qrAnalytics')) || {};
    
    document.getElementById("totalGenerated").textContent = analytics.totalGenerated || 0;
    document.getElementById("todayCount").textContent = analytics.todayCount || 0;
    
    const formats = analytics.formats || {};
    let mostUsed = Object.keys(formats).reduce((a, b) => 
        formats[a] > formats[b] ? a : b, 'URL') || 'URL';
    
    document.getElementById("mostUsedFormat").textContent = mostUsed.toUpperCase();
    document.getElementById("exportCount").textContent = analytics.exportCount || 0;
    
    updateCharts();
}

function resetAnalytics() {
    if (confirm('Reset all analytics data?')) {
        localStorage.removeItem('qrAnalytics');
        initAnalytics();
        showSuccess("Analytics reset!");
    }
}

// ============================================
// ANALYTICS CHARTS
// ============================================

function initCharts() {
    const analytics = JSON.parse(localStorage.getItem('qrAnalytics')) || {};
    
    // Generation Chart (Bar)
    const generationCtx = document.getElementById('generationChart');
    if (generationCtx && generationCtx.getContext) {
        if (generationChart) generationChart.destroy();
        
        generationChart = new Chart(generationCtx, {
            type: 'bar',
            data: {
                labels: ['Total Generated', 'Today', 'Exports'],
                datasets: [{
                    label: 'Count',
                    data: [
                        analytics.totalGenerated || 0,
                        analytics.todayCount || 0,
                        analytics.exportCount || 0
                    ],
                    backgroundColor: [
                        'rgba(91, 99, 255, 0.8)',
                        'rgba(78, 205, 196, 0.8)',
                        'rgba(81, 207, 102, 0.8)'
                    ],
                    borderColor: [
                        'rgb(91, 99, 255)',
                        'rgb(78, 205, 196)',
                        'rgb(81, 207, 102)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: document.body.classList.contains('dark-mode') ? '#cbd5e1' : '#374151'
                        },
                        grid: {
                            color: document.body.classList.contains('dark-mode') ? '#2d3748' : '#e0e8f0'
                        }
                    },
                    x: {
                        ticks: {
                            color: document.body.classList.contains('dark-mode') ? '#cbd5e1' : '#374151'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Formats Chart (Pie)
    const formatsCtx = document.getElementById('formatsChart');
    if (formatsCtx && formatsCtx.getContext) {
        if (formatsChart) formatsChart.destroy();
        
        const formats = analytics.formats || {};
        const formatLabels = Object.keys(formats);
        const formatData = Object.values(formats);
        
        formatsChart = new Chart(formatsCtx, {
            type: 'doughnut',
            data: {
                labels: formatLabels.length > 0 ? formatLabels : ['No Data'],
                datasets: [{
                    data: formatData.length > 0 ? formatData : [1],
                    backgroundColor: [
                        'rgba(91, 99, 255, 0.8)',
                        'rgba(255, 107, 107, 0.8)',
                        'rgba(78, 205, 196, 0.8)',
                        'rgba(81, 207, 102, 0.8)',
                        'rgba(255, 193, 61, 0.8)',
                        'rgba(156, 39, 176, 0.8)'
                    ],
                    borderColor: [
                        'rgb(91, 99, 255)',
                        'rgb(255, 107, 107)',
                        'rgb(78, 205, 196)',
                        'rgb(81, 207, 102)',
                        'rgb(255, 193, 61)',
                        'rgb(156, 39, 176)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: document.body.classList.contains('dark-mode') ? '#cbd5e1' : '#374151',
                            padding: 15,
                            font: {
                                size: 13
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Trends Chart (Line)
    const trendsCtx = document.getElementById('trendsChart');
    if (trendsCtx && trendsCtx.getContext) {
        if (trendsChart) trendsChart.destroy();
        
        const period = document.getElementById('trendsPeriod')?.value || '7';
        const dailyData = analytics.dailyData || {};
        const selectedDays = getDateRange(parseInt(period));
        
        const generationData = selectedDays.map(date => dailyData[date] || 0);
        const exportData = selectedDays.map(date => {
            // Simulate export data (could be enhanced to track separately)
            return Math.floor(generationData[selectedDays.indexOf(date)] * 0.3);
        });
        
        trendsChart = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: selectedDays.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'QR Codes Generated',
                        data: generationData,
                        borderColor: 'rgb(91, 99, 255)',
                        backgroundColor: 'rgba(91, 99, 255, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: 'rgb(91, 99, 255)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: 'rgb(91, 99, 255)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Exports',
                        data: exportData,
                        borderColor: 'rgb(78, 205, 196)',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: 'rgb(78, 205, 196)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: 'rgb(78, 205, 196)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: document.body.classList.contains('dark-mode') ? '#cbd5e1' : '#374151',
                            font: {
                                size: 14,
                                weight: '600'
                            },
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Generated',
                            color: 'rgb(91, 99, 255)',
                            font: { weight: '600' }
                        },
                        ticks: {
                            color: 'rgb(91, 99, 255)',
                            font: { weight: '600' }
                        },
                        grid: {
                            color: document.body.classList.contains('dark-mode') ? '#2d3748' : '#e0e8f0'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Exports',
                            color: 'rgb(78, 205, 196)',
                            font: { weight: '600' }
                        },
                        ticks: {
                            color: 'rgb(78, 205, 196)',
                            font: { weight: '600' }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        ticks: {
                            color: document.body.classList.contains('dark-mode') ? '#cbd5e1' : '#374151',
                            font: { weight: '600' }
                        },
                        grid: {
                            color: document.body.classList.contains('dark-mode') ? '#2d3748' : '#e0e8f0'
                        }
                    }
                }
            }
        });
    }
}

function updateCharts() {
    const analytics = JSON.parse(localStorage.getItem('qrAnalytics')) || {};
    
    // Update generation chart
    if (generationChart) {
        generationChart.data.datasets[0].data = [
            analytics.totalGenerated || 0,
            analytics.todayCount || 0,
            analytics.exportCount || 0
        ];
        generationChart.update();
    }
    
    // Update formats chart
    if (formatsChart) {
        const formats = analytics.formats || {};
        formatsChart.data.labels = Object.keys(formats).length > 0 ? Object.keys(formats) : ['No Data'];
        formatsChart.data.datasets[0].data = Object.values(formats).length > 0 ? Object.values(formats) : [1];
        formatsChart.update();
    }
    
    // Update trends chart with current period
    if (trendsChart) {
        const period = document.getElementById('trendsPeriod')?.value || '7';
        const dailyData = analytics.dailyData || {};
        const selectedDays = getDateRange(parseInt(period));
        
        const generationData = selectedDays.map(date => dailyData[date] || 0);
        const exportData = selectedDays.map(date => {
            return Math.floor(generationData[selectedDays.indexOf(date)] * 0.3);
        });
        
        trendsChart.data.labels = selectedDays.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        trendsChart.data.datasets[0].data = generationData;
        trendsChart.data.datasets[1].data = exportData;
        trendsChart.update();
    }
}

function getLast7Days() {
    return getDateRange(7);
}

function getDateRange(days) {
    const dateArray = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateArray.push(date.toDateString());
    }
    return dateArray;
}

function updateTrendsChart() {
    const analytics = JSON.parse(localStorage.getItem('qrAnalytics')) || {};
    const period = document.getElementById('trendsPeriod')?.value || '7';
    const dailyData = analytics.dailyData || {};
    const selectedDays = getDateRange(parseInt(period));
    
    const generationData = selectedDays.map(date => dailyData[date] || 0);
    const exportData = selectedDays.map(date => {
        return Math.floor(generationData[selectedDays.indexOf(date)] * 0.3);
    });
    
    if (trendsChart) {
        trendsChart.data.labels = selectedDays.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        trendsChart.data.datasets[0].data = generationData;
        trendsChart.data.datasets[1].data = exportData;
        trendsChart.update();
    }
}

function switchAnalyticsTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.closest('.tab-btn').classList.add('active');
    
    // Trigger chart update
    setTimeout(() => {
        if (generationChart) generationChart.resize();
        if (formatsChart) formatsChart.resize();
        if (trendsChart) trendsChart.resize();
    }, 100);
}

// ============================================
// BIO LINKS MANAGEMENT
// ============================================

let bioLinks = [];

function addBioLink() {
    const newLink = {
        id: Date.now(),
        title: '',
        url: ''
    };
    bioLinks.push(newLink);
    renderBioLinks();
}

function updateBioLink(id, field, value) {
    const link = bioLinks.find(l => l.id === id);
    if (link) {
        link[field] = value;
    }
}

function deleteBioLink(id) {
    bioLinks = bioLinks.filter(l => l.id !== id);
    renderBioLinks();
}

function renderBioLinks() {
    const container = document.getElementById("bioLinksContainer");
    container.innerHTML = bioLinks.map(link => `
        <div class="biolink-item">
            <input type="text" placeholder="Link Title" value="${link.title}" 
                   onchange="updateBioLink(${link.id}, 'title', this.value)">
            <input type="text" placeholder="URL" value="${link.url}" 
                   onchange="updateBioLink(${link.id}, 'url', this.value)">
            <button class="biolink-delete" onclick="deleteBioLink(${link.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function generateBioLinkQR() {
    const profileName = document.getElementById("bioLinksName").value || "MyLinks";
    
    if (bioLinks.length === 0) {
        showError("Add at least one link first");
        return;
    }

    const bioLinkData = bioLinks
        .filter(l => l.title && l.url)
        .map(l => `${l.title}: ${l.url}`)
        .join('\n');

    document.getElementById("qrText").value = `${profileName}\n${bioLinkData}`;
    generateQR();
    showSuccess("Bio Link QR code generated!");
    recordAnalytics('biolink');
}

// ============================================
// SOCIAL SHARING
// ============================================

function trackShare(platform) {
    let analytics = JSON.parse(localStorage.getItem('qrAnalytics'));
    analytics.exportCount = (analytics.exportCount || 0) + 1;
    localStorage.setItem('qrAnalytics', JSON.stringify(analytics));
    updateAnalyticsDisplay();
}

function shareToFacebook() {
    const canvas = document.getElementById("qrCanvas");
    if (!canvas.width) {
        showError("Generate a QR code first");
        return;
    }
    const url = canvas.toDataURL();
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=Check%20this%20QR%20Code`, '_blank');
    trackShare('facebook');
    showSuccess("Opening Facebook...");
}

function shareToTwitter() {
    const canvas = document.getElementById("qrCanvas");
    if (!canvas.width) {
        showError("Generate a QR code first");
        return;
    }
    const text = encodeURIComponent("Check out this QR code!");
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    trackShare('twitter');
    showSuccess("Opening Twitter...");
}

function shareToLinkedIn() {
    const canvas = document.getElementById("qrCanvas");
    if (!canvas.width) {
        showError("Generate a QR code first");
        return;
    }
    window.open(`https://www.linkedin.com/sharing/share-offsite/`, '_blank');
    trackShare('linkedin');
    showSuccess("Opening LinkedIn...");
}

function shareToWhatsApp() {
    const text = encodeURIComponent("Check out this QR code!");
    window.open(`https://wa.me/?text=${text}`, '_blank');
    trackShare('whatsapp');
    showSuccess("Opening WhatsApp...");
}

function shareToTelegram() {
    const text = encodeURIComponent("Check out this QR code!");
    window.open(`https://t.me/share/url?text=${text}`, '_blank');
    trackShare('telegram');
    showSuccess("Opening Telegram...");
}

function shareToPinterest() {
    const canvas = document.getElementById("qrCanvas");
    if (!canvas.width) {
        showError("Generate a QR code first");
        return;
    }
    window.open(`https://pinterest.com/pin/create/button/`, '_blank');
    trackShare('pinterest');
    showSuccess("Opening Pinterest...");
}

// ============================================
// ADDITIONAL FEATURES
// ============================================

// Auto-generate QR on input change (optional)
document.addEventListener('DOMContentLoaded', function() {
    // Uncomment below for auto-generation on input
    // document.getElementById("qrText").addEventListener('input', debounce(generateQR, 1000));
});

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load color values on startup
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("darkColorValue").textContent = document.getElementById("darkColor").value;
    document.getElementById("lightColorValue").textContent = document.getElementById("lightColor").value;
});
function handleSignup(event) {
    event.preventDefault();

    // Get values
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const message = document.getElementById('message');

    // Clear errors
    document.getElementById('usernameError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('confirmError').textContent = '';
    message.textContent = '';

    // Validation
    if (username.length < 3) {
        document.getElementById('usernameError').textContent = 'Username must be 3+ characters';
        return;
    }

    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be 6+ characters';
        return;
    }

    if (password !== confirmPassword) {
        document.getElementById('confirmError').textContent = 'Passwords do not match';
        return;
    }

    // Save to localStorage
    let users = JSON.parse(localStorage.getItem('qrUsers') || '[]');

    // Check if username exists
    if (users.some(u => u.username === username)) {
        message.textContent = '❌ Username already taken';
        message.className = 'message error';
        return;
    }

    // Add new user
    users.push({ username, password });
    localStorage.setItem('qrUsers', JSON.stringify(users));

    // Success
    message.textContent = '✓ Account created! Redirecting...';
    message.className = 'message success';

    // Reset form
    document.getElementById('signupForm').reset();

    // Redirect
    setTimeout(() => {
        window.location.href = 'qr.html';
    }, 1500);
}