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
public class PatientDTO {
    private Long id;
    private String name;
    private Integer age;
    private String roomNumber;
    private String condition;
    private LocalDateTime admittedAt;
}