package com.hospital.monitoring.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "patient_vital_signs")
public class PatientVitalSigns {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "heart_rate")
    private Double heartRate;

    @Column(name = "body_temperature")
    private Double bodyTemperature;

    @Column(name = "systolic_bp")
    private Integer systolicBP;

    @Column(name = "diastolic_bp")
    private Integer diastolicBP;

    @Column(name = "oxygen_saturation")
    private Integer oxygenSaturation;

    @Column(name = "respiratory_rate")
    private Integer respiratoryRate;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}