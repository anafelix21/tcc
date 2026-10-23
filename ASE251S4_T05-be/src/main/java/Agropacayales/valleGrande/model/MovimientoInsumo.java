package Agropacayales.valleGrande.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "movimientos_insumo")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MovimientoInsumo {

    @Id
    private String id;

    @Field("id_insumo")
    private String idInsumo;

    @Field("nombre_insumo")
    private String nombreInsumo;

    @Field("id_usuario")
    private String idUsuario;

    @Field("nombre_usuario")
    private String nombreUsuario;

    @Field("tipo_movimiento")
    private String tipoMovimiento;

    @Field("motivo")
    private String motivo;

    @Field("cantidad")
    private Integer cantidad;

    @Field("precio_unitario")
    private BigDecimal precioUnitario;

    @Field("subtotal")
    private BigDecimal subtotal;

    @Field("stock_anterior")
    private Integer stockAnterior;

    @Field("stock_nuevo")
    private Integer stockNuevo;

    @Field("referencia")
    private String referencia;

    @Field("observacion")
    private String observacion;

    @Field("fecha_movimiento")
    private String fechaMovimiento;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Field("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("idMovimiento")
    public String getIdMovimiento() {
        return this.id;
    }

    public void setIdInsumo(Object idInsumo) {
        this.idInsumo = idInsumo != null ? idInsumo.toString() : null;
    }

    public void setIdUsuario(Object idUsuario) {
        this.idUsuario = idUsuario != null ? idUsuario.toString() : null;
    }
}
