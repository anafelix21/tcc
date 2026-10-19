package Agropacayales.valleGrande.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActividadCultivoResponseDto {
    private Long idActividad;
    private Long idCultivo;
    private String nombreCultivo;
    private String tipoActividad;
    private String descripcion;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    private LocalDateTime fechaActividad;

    private BigDecimal costoTotal;
    private Boolean estado;
    private Boolean completado;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    private LocalDateTime updatedAt;

    private List<DetalleActividadResponseDto> detalles;
}
