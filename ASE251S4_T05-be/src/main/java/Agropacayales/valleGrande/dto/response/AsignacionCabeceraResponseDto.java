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
public class AsignacionCabeceraResponseDto {
    private Long idAsignacionCabecera;
    private Long idActividad;
    private String tipoActividad;
    private String nombreCultivo;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    private LocalDateTime fechaAsignacion;

    private BigDecimal horasTrabajadas;
    private BigDecimal costoTotalManoObra;
    private String observacion;
    private Boolean estado;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    private LocalDateTime updatedAt;

    private List<AsignacionDetalleResponseDto> detalles;
}
