package com.hospital.monitoring;

import com.hospital.monitoring.entity.Patient;
import com.hospital.monitoring.repository.PatientRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
@EnableScheduling
public class MonitoringApplication {

	public static void main(String[] args) {
		SpringApplication.run(MonitoringApplication.class, args);
	}

	@Bean
	CommandLineRunner initData(PatientRepository patientRepository) {
		return args -> {
			// Create sample patients
			List<Patient> patients = List.of(
					Patient.builder()
							.name("John Smith")
							.age(45)
							.roomNumber("101")
							.condition("Stable")
							.build(),
					Patient.builder()
							.name("Sarah Johnson")
							.age(62)
							.roomNumber("205")
							.condition("Critical")
							.build(),
					Patient.builder()
							.name("Mike Wilson")
							.age(38)
							.roomNumber("104")
							.condition("Recovering")
							.build()
			);

			patientRepository.saveAll(patients);
		};
	}
}