package Agropacayales.valleGrande.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionDetalleResponseDto {
    private Long idAsignacionDetalle;
    private String idUsuario;
    private String nombreCompletoUsuario;
    private BigDecimal costoManoObra;
}
