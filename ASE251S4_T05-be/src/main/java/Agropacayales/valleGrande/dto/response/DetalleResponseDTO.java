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
public class DetalleResponseDTO {
    private Integer idHarvestDetail;
    private Integer idCultivo;
    private BigDecimal kilosOptimos;
    private BigDecimal kilosMerma;
    private BigDecimal totalKilos;
}
