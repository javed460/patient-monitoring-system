package com.hospital.monitoring.repository;

import com.hospital.monitoring.entity.PatientVitalSigns;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientVitalSignsRepository extends JpaRepository<PatientVitalSigns, Long> {
}