package com.hospital.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientVitalSignsDTO {
    private Long id;
    private PatientDTO patient;
    private Double heartRate;
    private Double bodyTemperature;
    private Integer systolicBP;
    private Integer diastolicBP;
    private Integer oxygenSaturation;
    private Integer respiratoryRate;
    private LocalDateTime timestamp;
}