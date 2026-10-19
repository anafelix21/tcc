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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Table("asignacion_cabecera")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AsignacionCabecera {

    @Id
    @Column("id_asignacion_cabecera")
    private Long idAsignacionCabecera;

    @Column("id_actividad")
    private Long idActividad;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Column("fecha_asignacion")
    private LocalDateTime fechaAsignacion;

    @Column("horas_trabajadas")
    private BigDecimal horasTrabajadas;

    @Column("costo_total_mano_obra")
    private BigDecimal costoTotalManoObra;

    @Column("observacion")
    private String observacion;

    @Column("estado")
    private Boolean estado;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Column("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
