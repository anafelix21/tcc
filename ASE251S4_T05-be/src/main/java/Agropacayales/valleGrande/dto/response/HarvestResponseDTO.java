package Agropacayales.valleGrande.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestResponseDTO {
    private Integer idHarvest;
    private String responsable;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaCosecha;

    private Boolean estado;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    private LocalDateTime updatedAt;

    private List<DetalleResponseDTO> detalles;
}
