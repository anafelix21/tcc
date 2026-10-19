package Agropacayales.valleGrande.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestRequestDTO {

    @NotBlank(message = "El responsable de la cosecha es obligatorio.")
    private String responsable;

    @NotNull(message = "La fecha de cosecha no puede ser nula.")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaCosecha;

    @NotEmpty(message = "La cosecha debe incluir al menos un detalle de cultivo.")
    @Valid
    private List<DetalleCosechaDTO> detalles;
}
