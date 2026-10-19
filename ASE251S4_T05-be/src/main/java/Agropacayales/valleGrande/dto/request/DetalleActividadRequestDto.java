package Agropacayales.valleGrande.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetalleActividadRequestDto {

    @NotBlank(message = "El ID del insumo es obligatorio.")
    private String idInsumo;

    @NotNull(message = "La cantidad es obligatoria.")
    @Min(value = 1, message = "La cantidad debe ser al menos 1.")
    private Integer cantidad;
}
