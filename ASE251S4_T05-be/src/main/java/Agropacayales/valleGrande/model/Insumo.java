package Agropacayales.valleGrande.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "insumos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Insumo {

    @Id
    private String id;

    @NotBlank(message = "El nombre del insumo no puede estar vacío.")
    @Size(max = 100, message = "El nombre del insumo no puede superar los 100 caracteres.")
    @Field("nombre")
    private String nombre;

    @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres.")
    @Field("descripcion")
    private String descripcion;

    @NotNull(message = "El precio es obligatorio.")
    @Positive(message = "El precio del insumo debe ser un número positivo mayor que cero.")
    @Field("precio")
    private BigDecimal precio;

    @NotNull(message = "El stock es obligatorio.")
    @PositiveOrZero(message = "El stock disponible no puede ser un número negativo.")
    @Field("stock")
    private Integer stock;

    @NotBlank(message = "La unidad de medida es obligatoria.")
    @Size(max = 20, message = "La unidad de medida no puede superar los 20 caracteres.")
    @Field("unidad_medida")
    private String unidadMedida;

    @NotBlank(message = "El tipo de insumo es obligatorio.")
    @Size(max = 50, message = "El tipo de insumo no puede superar los 50 caracteres.")
    @Field("tipo_insumo")
    private String tipoInsumo;

    @Size(max = 100, message = "El proveedor no puede superar los 100 caracteres.")
    @Field("proveedor")
    private String proveedor;

    @Size(max = 100, message = "La presentación no puede superar los 100 caracteres.")
    @Field("presentacion")
    private String presentacion;

    @Builder.Default
    @Field("estado")
    private Boolean estado = true;

    // CAMPOS DE AUDITORÍA
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Field("created_at")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Field("updated_at")
    private LocalDateTime updatedAt;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Field("deleted_at")
    private LocalDateTime deletedAt;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", timezone = "America/Lima")
    @Field("restored_at")
    private LocalDateTime restoredAt;
}
