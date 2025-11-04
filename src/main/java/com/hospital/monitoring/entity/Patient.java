package com.hospital.monitoring.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private Integer age;

    @Column(name = "room_number")
    private String roomNumber;

    private String condition;

    @Column(name = "admitted_at")
    private LocalDateTime admittedAt;

    @Builder.Default
    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PatientVitalSigns> vitalSigns = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        admittedAt = LocalDateTime.now();
    }
}