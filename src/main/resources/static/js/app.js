class PatientMonitoringSystem {
    constructor() {
        this.stompClient = null;
        this.currentPatientId = null;
        this.patients = [];
        this.vitalsData = {
            heartRate: [],
            temperature: [],
            timestamps: []
        };
        this.charts = {};

        this.init();
    }

    init() {
        this.loadPatients();
        this.initWebSocket();
        this.initCharts();
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
    }

    loadPatients() {
        fetch('/api/patients')
            .then(response => response.json())
            .then(patients => {
                this.patients = patients;
                this.renderPatientsList();
                // Auto-select first patient for monitoring
                if (patients.length > 0) {
                    this.selectPatient(patients[0].id);
                }
            })
            .catch(error => console.error('Error loading patients:', error));
    }

    renderPatientsList() {
        const container = document.getElementById('patientsList');
        container.innerHTML = this.patients.map(patient => `
            <div class="col-md-4">
                <div class="card patient-card" onclick="monitoringSystem.selectPatient(${patient.id})">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${patient.name}</h5>
                            <span class="status-badge bg-${this.getStatusClass(patient.condition)}">
                                ${patient.condition}
                            </span>
                        </div>
                        <p class="card-text mb-1">
                            <i class="fas fa-user me-2"></i>Age: ${patient.age}
                        </p>
                        <p class="card-text mb-1">
                            <i class="fas fa-door-open me-2"></i>Room: ${patient.roomNumber}
                        </p>
                        <p class="card-text">
                            <i class="fas fa-clock me-2"></i>Admitted: ${new Date(patient.admittedAt).toLocaleDateString()}
                        </p>
                        <div class="vital-signs-preview" id="preview-${patient.id}">
                            <small class="text-muted">Loading vitals...</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStatusClass(condition) {
        const statusMap = {
            'Critical': 'critical',
            'Stable': 'stable',
            'Recovering': 'recovering'
        };
        return statusMap[condition] || 'stable';
    }

    selectPatient(patientId) {
        this.currentPatientId = patientId;

        // Update UI to show selected patient
        document.querySelectorAll('.patient-card').forEach(card => {
            card.style.border = '2px solid transparent';
        });
        event.currentTarget.style.border = '2px solid #3498db';

        // Clear previous data
        this.vitalsData = {
            heartRate: [],
            temperature: [],
            timestamps: []
        };

        // Update charts
        this.updateCharts();
    }

    initWebSocket() {
        const socket = new SockJS('/ws-monitoring');
        this.stompClient = Stomp.over(socket);

        this.stompClient.connect({}, (frame) => {
            console.log('Connected: ' + frame);
            document.getElementById('connectionStatus').className = 'text-success';
            document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-circle me-2"></i>Connected';

            // Subscribe to ALL patient-specific topics
            this.subscribeToAllPatients();

        }, (error) => {
            console.error('WebSocket connection error:', error);
            document.getElementById('connectionStatus').className = 'text-danger';
            document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-circle me-2"></i>Disconnected';

            // Attempt reconnection after 5 seconds
            setTimeout(() => this.initWebSocket(), 5000);
        });
    }

    subscribeToAllPatients() {
        // Subscribe to each patient's specific topic
        this.patients.forEach(patient => {
            this.stompClient.subscribe(`/topic/patient.${patient.id}.vitals`, (message) => {
                const vitalSigns = JSON.parse(message.body);
                this.handleVitalSignsUpdate(vitalSigns);
            });
        });
    }

    handleVitalSignsUpdate(vitalSigns) {
        // Update patient preview
        this.updatePatientPreview(vitalSigns);

        // If this is for the currently selected patient, update displays
        if (vitalSigns.patient.id === this.currentPatientId) {
            this.updateCurrentVitalsDisplay(vitalSigns);
            this.updateChartsWithNewData(vitalSigns);
            this.checkAlerts(vitalSigns);
        }
    }

    updatePatientPreview(vitalSigns) {
        const previewElement = document.getElementById(`preview-${vitalSigns.patient.id}`);
        if (previewElement) {
            previewElement.innerHTML = `
                <div class="row text-center">
                    <div class="col-4">
                        <small class="d-block vital-label">HR</small>
                        <span class="vital-value ${this.getVitalStatusClass('heartRate', vitalSigns.heartRate)}">
                            ${Math.round(vitalSigns.heartRate)}
                        </span>
                    </div>
                    <div class="col-4">
                        <small class="d-block vital-label">Temp</small>
                        <span class="vital-value ${this.getVitalStatusClass('temperature', vitalSigns.bodyTemperature)}">
                            ${vitalSigns.bodyTemperature.toFixed(1)}
                        </span>
                    </div>
                    <div class="col-4">
                        <small class="d-block vital-label">SpO2</small>
                        <span class="vital-value ${this.getVitalStatusClass('oxygen', vitalSigns.oxygenSaturation)}">
                            ${vitalSigns.oxygenSaturation}%
                        </span>
                    </div>
                </div>
            `;
        }
    }

    getVitalStatusClass(type, value) {
        switch(type) {
            case 'heartRate':
                return value > 100 || value < 60 ? 'critical' : value > 90 || value < 70 ? 'warning' : 'normal';
            case 'temperature':
                return value > 38.5 || value < 36 ? 'critical' : value > 37.5 || value < 36.5 ? 'warning' : 'normal';
            case 'oxygen':
                return value < 92 ? 'critical' : value < 95 ? 'warning' : 'normal';
            default:
                return 'normal';
        }
    }

    updateCurrentVitalsDisplay(vitalSigns) {
        const container = document.getElementById('currentVitals');
        container.innerHTML = `
            <div class="row text-center">
                <div class="col-6 mb-3">
                    <div class="vital-sign">
                        <i class="fas fa-heartbeat fa-2x mb-2 ${this.getVitalStatusClass('heartRate', vitalSigns.heartRate)}"></i>
                        <div class="vital-value ${this.getVitalStatusClass('heartRate', vitalSigns.heartRate)}">
                            ${Math.round(vitalSigns.heartRate)}
                        </div>
                        <div class="vital-label">Heart Rate</div>
                        <small>BPM</small>
                    </div>
                </div>
                <div class="col-6 mb-3">
                    <div class="vital-sign">
                        <i class="fas fa-thermometer-half fa-2x mb-2 ${this.getVitalStatusClass('temperature', vitalSigns.bodyTemperature)}"></i>
                        <div class="vital-value ${this.getVitalStatusClass('temperature', vitalSigns.bodyTemperature)}">
                            ${vitalSigns.bodyTemperature.toFixed(1)}
                        </div>
                        <div class="vital-label">Temperature</div>
                        <small>°C</small>
                    </div>
                </div>
                <div class="col-6 mb-3">
                    <div class="vital-sign">
                        <i class="fas fa-lungs fa-2x mb-2 ${this.getVitalStatusClass('oxygen', vitalSigns.oxygenSaturation)}"></i>
                        <div class="vital-value ${this.getVitalStatusClass('oxygen', vitalSigns.oxygenSaturation)}">
                            ${vitalSigns.oxygenSaturation}%
                        </div>
                        <div class="vital-label">Oxygen Sat</div>
                        <small>SpO2</small>
                    </div>
                </div>
                <div class="col-6 mb-3">
                    <div class="vital-sign">
                        <i class="fas fa-tachometer-alt fa-2x mb-2 normal"></i>
                        <div class="vital-value normal">
                            ${vitalSigns.systolicBP}/${vitalSigns.diastolicBP}
                        </div>
                        <div class="vital-label">Blood Pressure</div>
                        <small>mmHg</small>
                    </div>
                </div>
            </div>
        `;
    }

    initCharts() {
        const ctx = document.getElementById('vitalsChart').getContext('2d');
        this.charts.vitals = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Heart Rate (BPM)',
                        data: [],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Temperature (°C)',
                        data: [],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Heart Rate (BPM)'
                        },
                        suggestedMin: 50,
                        suggestedMax: 120
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        },
                        suggestedMin: 35,
                        suggestedMax: 40,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    updateChartsWithNewData(vitalSigns) {
        const now = new Date();
        const timeLabel = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

        // Add new data
        this.vitalsData.heartRate.push(vitalSigns.heartRate);
        this.vitalsData.temperature.push(vitalSigns.bodyTemperature);
        this.vitalsData.timestamps.push(timeLabel);

        // Keep only last 10 data points
        if (this.vitalsData.heartRate.length > 10) {
            this.vitalsData.heartRate.shift();
            this.vitalsData.temperature.shift();
            this.vitalsData.timestamps.shift();
        }

        this.updateCharts();
    }

    updateCharts() {
        this.charts.vitals.data.labels = this.vitalsData.timestamps;
        this.charts.vitals.data.datasets[0].data = this.vitalsData.heartRate;
        this.charts.vitals.data.datasets[1].data = this.vitalsData.temperature;
        this.charts.vitals.update();
    }

    checkAlerts(vitalSigns) {
        const alerts = [];

        if (vitalSigns.heartRate > 100) {
            alerts.push({ type: 'critical', message: `High Heart Rate: ${Math.round(vitalSigns.heartRate)} BPM` });
        } else if (vitalSigns.heartRate < 60) {
            alerts.push({ type: 'critical', message: `Low Heart Rate: ${Math.round(vitalSigns.heartRate)} BPM` });
        }

        if (vitalSigns.bodyTemperature > 38.5) {
            alerts.push({ type: 'critical', message: `High Temperature: ${vitalSigns.bodyTemperature.toFixed(1)}°C` });
        }

        if (vitalSigns.oxygenSaturation < 92) {
            alerts.push({ type: 'critical', message: `Low Oxygen Saturation: ${vitalSigns.oxygenSaturation}%` });
        }

        this.displayAlerts(alerts);
    }

    displayAlerts(alerts) {
        const container = document.getElementById('alertsContainer');

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    All vitals within normal range
                </div>
            `;
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type === 'critical' ? 'danger' : 'warning'}">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${alert.message}
            </div>
        `).join('');
    }

    updateCurrentTime() {
        const now = new Date();
        document.getElementById('currentTime').textContent =
            now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }
}

// Initialize the monitoring system when the page loads
const monitoringSystem = new PatientMonitoringSystem();