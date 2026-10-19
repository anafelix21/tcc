package Agropacayales.valleGrande.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionDetalleRequestDto {

    @NotBlank(message = "El ID de usuario es obligatorio.")
    private String idUsuario;

    @NotNull(message = "El costo de mano de obra es obligatorio.")
    @DecimalMin(value = "0.01", message = "El costo de mano de obra debe ser mayor a cero.")
    private BigDecimal costoManoObra;
}
