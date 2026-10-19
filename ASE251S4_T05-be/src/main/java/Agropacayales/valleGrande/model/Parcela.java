package Agropacayales.valleGrande.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "parcelas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Parcela {

    @Id
    private String id;

    @NotBlank(message = "El nombre de la parcela es obligatorio.")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres.")
    @Field("nombre")
    private String nombre;

    @Size(max = 200, message = "La ubicación no puede superar los 200 caracteres.")
    @Field("ubicacion")
    private String ubicacion;

    @Field("area_hectareas")
    private BigDecimal areaHectareas;

    @Size(max = 80, message = "El tipo de suelo no puede superar los 80 caracteres.")
    @Field("tipo_suelo")
    private String tipoSuelo;

    @Size(max = 100, message = "El responsable no puede superar los 100 caracteres.")
    @Field("responsable")
    private String responsable;

    @Size(max = 50, message = "El estado de riego no puede superar los 50 caracteres.")
    @Field("estado_riego")
    private String estadoRiego;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Field("fecha_ultima_siembra")
    private LocalDate fechaUltimaSiembra;

    @Size(max = 100, message = "La producción estimada no puede superar los 100 caracteres.")
    @Field("produccion_estimada")
    private String produccionEstimada;

    @Size(max = 100, message = "El cultivo actual no puede superar los 100 caracteres.")
    @Field("cultivo_actual")
    private String cultivoActual;

    @Field("observaciones")
    private String observaciones;

    @Builder.Default
    @Field("en_uso")
    private Boolean enUso = false;

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
