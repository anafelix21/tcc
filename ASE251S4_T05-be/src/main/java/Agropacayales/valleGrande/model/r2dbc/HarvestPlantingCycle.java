package Agropacayales.valleGrande.model.r2dbc;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("harvest_planting_cycle")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HarvestPlantingCycle {

    @Id
    @Column("id_harvest_detail")
    private Integer idHarvestDetail;

    @Column("id_harvest")
    private Integer idHarvest;

    @Column("id_cultivo")
    private Integer idCultivo;

    @Column("kilos_optimos")
    private BigDecimal kilosOptimos;

    @Column("kilos_merma")
    private BigDecimal kilosMerma;
}
