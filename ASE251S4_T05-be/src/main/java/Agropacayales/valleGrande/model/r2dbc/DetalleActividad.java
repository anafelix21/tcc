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

@Table("detalle_actividad")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DetalleActividad {

    @Id
    @Column("id_detalle")
    private Long idDetalle;

    @Column("id_actividad")
    private Long idActividad;

    @Column("id_insumo")
    private String idInsumo;

    @Column("cantidad")
    private Integer cantidad;

    @Column("precio_unitario")
    private BigDecimal precioUnitario;

    @Column("subtotal")
    private BigDecimal subtotal;
}
