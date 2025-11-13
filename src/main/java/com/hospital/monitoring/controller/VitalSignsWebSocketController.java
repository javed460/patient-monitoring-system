package com.hospital.monitoring.controller;

import com.hospital.monitoring.entity.Patient;
import com.hospital.monitoring.entity.PatientVitalSigns;
import com.hospital.monitoring.repository.PatientRepository;
import com.hospital.monitoring.repository.PatientVitalSignsRepository;
import com.hospital.monitoring.dto.PatientDTO;
import com.hospital.monitoring.dto.PatientVitalSignsDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Controller
@RequiredArgsConstructor
@Slf4j
public class VitalSignsWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final PatientRepository patientRepository;
    private final PatientVitalSignsRepository vitalSignsRepository;
    private final Random random = new Random();

    @Scheduled(fixedRate = 3000)
    public void sendSimulatedVitalSigns() {
        List<Patient> patients = patientRepository.findAll();

        if (patients.isEmpty()) {
            return;
        }

        for (Patient patient : patients) {
            PatientVitalSigns vitals = generateVitalSigns(patient);
            vitalSignsRepository.save(vitals);

            // Convert to DTO before sending
            PatientVitalSignsDTO vitalsDTO = convertToDTO(vitals);

            // Send to patient-specific topic
            messagingTemplate.convertAndSend("/topic/patient." + patient.getId() + ".vitals", vitalsDTO);

            log.info("Sent vitals for patient {}: HR={}, Temp={}",
                    patient.getName(), vitals.getHeartRate(), vitals.getBodyTemperature());
        }
    }

    private PatientVitalSigns generateVitalSigns(Patient patient) {
        double baseHeartRate = 70.0;
        double baseTemp = 36.5;

        if ("Critical".equals(patient.getCondition())) {
            baseHeartRate = 90.0;
            baseTemp = 37.5;
        } else if ("Stable".equals(patient.getCondition())) {
            baseHeartRate = 75.0;
            baseTemp = 36.8;
        }

        return PatientVitalSigns.builder()
                .patient(patient)
                .heartRate(baseHeartRate + (random.nextDouble() * 20 - 10))
                .bodyTemperature(baseTemp + (random.nextDouble() * 1.5 - 0.75))
                .systolicBP(110 + random.nextInt(30))
                .diastolicBP(70 + random.nextInt(20))
                .oxygenSaturation(90 + random.nextInt(8))
                .respiratoryRate(12 + random.nextInt(8))
                .timestamp(LocalDateTime.now())
                .build();
    }

    private PatientVitalSignsDTO convertToDTO(PatientVitalSigns vitals) {
        Patient patient = vitals.getPatient();
        PatientDTO patientDTO = PatientDTO.builder()
                .id(patient.getId())
                .name(patient.getName())
                .age(patient.getAge())
                .roomNumber(patient.getRoomNumber())
                .condition(patient.getCondition())
                .admittedAt(patient.getAdmittedAt())
                .build();

        return PatientVitalSignsDTO.builder()
                .id(vitals.getId())
                .patient(patientDTO)
                .heartRate(vitals.getHeartRate())
                .bodyTemperature(vitals.getBodyTemperature())
                .systolicBP(vitals.getSystolicBP())
                .diastolicBP(vitals.getDiastolicBP())
                .oxygenSaturation(vitals.getOxygenSaturation())
                .respiratoryRate(vitals.getRespiratoryRate())
                .timestamp(vitals.getTimestamp())
                .build();
    }
}