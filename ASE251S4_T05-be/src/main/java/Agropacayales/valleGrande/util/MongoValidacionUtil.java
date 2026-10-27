package Agropacayales.valleGrande.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Traduce los errores del validador $jsonSchema de MongoDB (código 121, "Document failed validation")
 * a mensajes claros en español, para responder 400 en lugar de 500 con el texto técnico del driver.
 */
public final class MongoValidacionUtil {

    private static final Pattern PROPIEDAD = Pattern.compile(
            "\"propertyName\":\\s*\"([^\"]+)\".*?\"operatorName\":\\s*\"(\\w+)\",\\s*\"specifiedAs\":\\s*\\{\"\\w+\":\\s*([^}]*)\\}");
    private static final Pattern FALTANTES = Pattern.compile("\"missingProperties\":\\s*\\[([^\\]]*)\\]");

    private MongoValidacionUtil() {
    }

    public static boolean esValidacionMongo(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            String msg = t.getMessage();
            if (msg != null && msg.contains("Document failed validation")) {
                return true;
            }
        }
        return false;
    }

    public static String traducir(Throwable ex) {
        String msg = "";
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t.getMessage() != null && t.getMessage().contains("Document failed validation")) {
                msg = t.getMessage();
                break;
            }
        }
        List<String> problemas = new ArrayList<>();

        Matcher faltantes = FALTANTES.matcher(msg);
        while (faltantes.find()) {
            for (String campo : faltantes.group(1).replace("\"", "").split(",")) {
                if (!campo.isBlank()) {
                    problemas.add("el campo '" + campo.trim() + "' es obligatorio");
                }
            }
        }

        // Cada propiedad se procesa por separado para no mezclar sus reglas
        for (String bloque : msg.split("\\{\"propertyName\"")) {
            Matcher m = PROPIEDAD.matcher("{\"propertyName\"" + bloque);
            if (m.find()) {
                problemas.add(describir(m.group(1), m.group(2), m.group(3).trim()));
            }
        }

        if (problemas.isEmpty()) {
            return "Los datos no cumplen las reglas de validación de la base de datos.";
        }
        String texto = String.join("; ", problemas);
        return Character.toUpperCase(texto.charAt(0)) + texto.substring(1) + ".";
    }

    private static String describir(String campo, String regla, String valor) {
        String c = "el campo '" + campo + "'";
        return switch (regla) {
            case "minLength" -> c + " debe tener al menos " + valor + " caracteres";
            case "maxLength" -> c + " no puede superar " + valor + " caracteres";
            case "minimum" -> c + " debe ser mayor o igual a " + valor;
            case "maximum" -> c + " debe ser menor o igual a " + valor;
            case "enum" -> c + " tiene un valor no permitido. Valores aceptados: " + valor.replaceAll("[\\[\\]\"]", "").replaceAll("\\s*,\\s*", ", ");
            case "pattern" -> c + " no tiene un formato válido";
            case "bsonType" -> c + " tiene un tipo de dato no válido (se esperaba " + valor.replaceAll("[\\[\\]\"]", "") + ")";
            default -> c + " no cumple la regla '" + regla + "'";
        };
    }
}
