package Agropacayales.valleGrande.model.r2dbc;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Table("harvest")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Harvest {

    @Id
    @Column("id_harvest")
    private Integer idHarvest;

    @Column("responsable")
    private String responsable;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column("fecha_cosecha")
    private LocalDate fechaCosecha;

    @Column("estado")
    private Boolean estado;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Column("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
