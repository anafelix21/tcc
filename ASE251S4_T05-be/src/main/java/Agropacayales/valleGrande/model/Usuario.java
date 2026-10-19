package Agropacayales.valleGrande.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "usuarios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Usuario {

    @Id
    private String id;

    @NotBlank(message = "El nombre es obligatorio.")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres.")
    @Field("nombre")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio.")
    @Size(max = 100, message = "El apellido no puede superar los 100 caracteres.")
    @Field("apellido")
    private String apellido;

    @NotBlank(message = "El correo es obligatorio.")
    @Email(message = "El correo electrónico debe tener un formato válido.")
    @Size(max = 100, message = "El correo no puede superar los 100 caracteres.")
    @Indexed(unique = true)
    @Field("correo")
    private String correo;

    @Field("password")
    private String password;

    @Size(max = 20, message = "El rol no puede superar los 20 caracteres.")
    @Field("rol")
    private String rol;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Field("fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Field("fecha_contratacion")
    private LocalDate fechaContratacion;

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
