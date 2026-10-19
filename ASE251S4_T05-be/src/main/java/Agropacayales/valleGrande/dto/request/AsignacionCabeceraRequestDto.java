package Agropacayales.valleGrande.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionCabeceraRequestDto {

    @NotNull(message = "El ID de la actividad de cultivo es obligatorio.")
    private Long idActividad;

    @NotNull(message = "Las horas trabajadas son obligatorias.")
    @DecimalMin(value = "0.1", message = "Las horas trabajadas deben ser mayores a 0.")
    private BigDecimal horasTrabajadas;

    private String observacion;

    @NotEmpty(message = "Debe asignar al menos un trabajador a la actividad.")
    @Valid
    private List<AsignacionDetalleRequestDto> detalles;
}
