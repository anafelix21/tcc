package Agropacayales.valleGrande.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActividadCultivoRequestDto {

    @NotNull(message = "El ID del cultivo es obligatorio.")
    private Long idCultivo;

    @NotBlank(message = "El tipo de actividad es obligatorio.")
    private String tipoActividad;

    private String descripcion;

    @NotEmpty(message = "Debe incluir al menos un detalle de insumo para la actividad.")
    @Valid
    private List<DetalleActividadRequestDto> detalles;
}
