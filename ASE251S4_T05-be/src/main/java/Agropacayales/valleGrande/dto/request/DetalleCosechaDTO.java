package Agropacayales.valleGrande.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetalleCosechaDTO {

    @NotNull(message = "El ID del cultivo es obligatorio.")
    private Integer idCultivo;

    @NotNull(message = "Los kilos óptimos no pueden ser nulos.")
    @PositiveOrZero(message = "Los kilos óptimos deben ser mayor o igual a cero.")
    private BigDecimal kilosOptimos;

    @NotNull(message = "Los kilos de merma no pueden ser nulos.")
    @PositiveOrZero(message = "Los kilos de merma deben ser mayor o igual a cero.")
    private BigDecimal kilosMerma;
}
