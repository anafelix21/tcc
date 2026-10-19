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

@Table("asignacion_detalle")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AsignacionDetalle {

    @Id
    @Column("id_asignacion_detalle")
    private Long idAsignacionDetalle;

    @Column("id_asignacion_cabecera")
    private Long idAsignacionCabecera;

    @Column("id_usuario")
    private String idUsuario;

    @Column("costo_mano_obra")
    private BigDecimal costoManoObra;
}
