package com.hospital.monitoring.controller;

import com.hospital.monitoring.entity.Patient;
import com.hospital.monitoring.repository.PatientRepository;
import com.hospital.monitoring.dto.PatientDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin("*")
public class PatientController {

    private final PatientRepository patientRepository;

    @GetMapping
    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @PostMapping
    public PatientDTO createPatient(@RequestBody PatientDTO patientDTO) {
        Patient patient = Patient.builder()
                .name(patientDTO.getName())
                .age(patientDTO.getAge())
                .roomNumber(patientDTO.getRoomNumber())
                .condition(patientDTO.getCondition())
                .build();
        Patient savedPatient = patientRepository.save(patient);
        return convertToDTO(savedPatient);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientDTO> getPatientById(@PathVariable Long id) {
        return patientRepository.findById(id)
                .map(patient -> ResponseEntity.ok(convertToDTO(patient)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePatient(@PathVariable Long id) {
        patientRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private PatientDTO convertToDTO(Patient patient) {
        return PatientDTO.builder()
                .id(patient.getId())
                .name(patient.getName())
                .age(patient.getAge())
                .roomNumber(patient.getRoomNumber())
                .condition(patient.getCondition())
                .admittedAt(patient.getAdmittedAt())
                .build();
    }
}