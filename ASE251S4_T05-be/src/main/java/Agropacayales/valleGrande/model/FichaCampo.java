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

import java.time.LocalDateTime;

@Document(collection = "field_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FichaCampo {

    @Id
    private String id;

    @Field("codigo_ficha")
    private String codigoFicha;

    @Field("id_cultivo")
    private Long idCultivo;

    @Field("nombre_cultivo")
    private String nombreCultivo;

    @Field("id_usuario")
    private String idUsuario;

    @Field("nombre_usuario")
    private String nombreUsuario;

    @Field("fecha_registro")
    private String fechaRegistro;

    @Field("etapa_fenologica")
    private String etapaFenologica;

    @Field("temperatura_amb")
    private Double temperaturaAmb;

    @Field("humedad_relativa")
    private Double humedadRelativa;

    @Field("condicion_clima")
    private String condicionClima;

    @Field("estado_cultivo")
    private String estadoCultivo;

    @Builder.Default
    @Field("necesita_riego")
    private Boolean necesitaRiego = false;

    @Builder.Default
    @Field("necesita_fumigacion")
    private Boolean necesitaFumigacion = false;

    @Field("diagnostico")
    private String diagnostico;

    @Field("accion_tomada")
    private String accionTomada;

    @Field("accion_pendiente")
    private String accionPendiente;

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

    @JsonProperty("idFicha")
    public String getIdFicha() {
        return this.id;
    }

    public void setIdUsuario(Object idUsuario) {
        this.idUsuario = idUsuario != null ? idUsuario.toString() : null;
    }
}
