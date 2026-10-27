package Agropacayales.valleGrande.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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

@Document(collection = "plots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Parcela {

    @Id
    private String id;

    @NotBlank(message = "El nombre de la parcela es obligatorio.")
    @Size(min = 3, max = 100, message = "El nombre de la parcela debe tener entre 3 y 100 caracteres.")
    @Field("nombre")
    private String nombre;

    @Size(max = 200, message = "La ubicación no puede superar los 200 caracteres.")
    @Field("ubicacion")
    private String ubicacion;

    @Field(value = "area_hectareas", targetType = org.springframework.data.mongodb.core.mapping.FieldType.DECIMAL128)
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

    // ===== Modelo embebido exigido por el validador $jsonSchema de MongoDB (V002 - Hugo Fernández) =====
    @Field("hectareas")
    private Double hectareas;

    @Field("condiciones_edaficas")
    private CondicionesEdaficas condicionesEdaficas;

    @Field("sistema_riego")
    private SistemaRiego sistemaRiego;

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

    /** Embedding 1:1 — análisis físico-químico del suelo. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CondicionesEdaficas {
        @Field("textura")
        private String textura;
        @Field("ph_promedio")
        private Double phPromedio;
        @Field("materia_organica_pct")
        private Double materiaOrganicaPct;
    }

    /** Embedding 1:1 — red de riego tecnificado. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SistemaRiego {
        @Field("tipo")
        private String tipo;
        @Field("caudal_lph")
        private Double caudalLph;
        @Field("sector_valvula")
        private String sectorValvula;
    }

    @JsonProperty("idParcela")
    public String getIdParcela() {
        return this.id;
    }
}
