package Agropacayales.valleGrande.util;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.exception.BusinessValidationException;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.function.BiFunction;
import java.util.function.Function;

public final class ArchivoUtil {

    private ArchivoUtil() {}

    public static Mono<byte[]> leerBytes(FilePart file) {
        return DataBufferUtils.join(file.content())
                .map(buffer -> {
                    byte[] bytes = new byte[buffer.readableByteCount()];
                    buffer.read(bytes);
                    DataBufferUtils.release(buffer);
                    return bytes;
                })
                .switchIfEmpty(Mono.error(new BusinessValidationException("El archivo está vacío.")));
    }

    public static List<String[]> filasCsv(byte[] bytes) {
        String texto = new String(bytes, StandardCharsets.UTF_8);
        if (texto.startsWith("\uFEFF")) {
            texto = texto.substring(1);
        }
        String[] lineas = texto.split("\\r?\\n");
        List<String[]> filas = new ArrayList<>();
        for (int i = 1; i < lineas.length; i++) {
            if (lineas[i].isBlank()) continue;
            String[] partes = lineas[i].split("[,;](?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
            String[] c = Arrays.stream(partes)
                    .map(s -> s.trim().replaceAll("^\"|\"$", ""))
                    .toArray(String[]::new);
            filas.add(c);
        }
        return filas;
    }

    public static List<String[]> filasExcel(byte[] bytes, int totalColumnas) throws Exception {
        List<String[]> filas = new ArrayList<>();
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String[] c = new String[totalColumnas];
                for (int j = 0; j < totalColumnas; j++) {
                    c[j] = valorCelda(row.getCell(j), fmt);
                }
                if (Arrays.stream(c).allMatch(String::isBlank)) continue;
                filas.add(c);
            }
        }
        return filas;
    }

    private static String valorCelda(Cell cell, DataFormatter fmt) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate().toString();
        }
        return fmt.formatCellValue(cell).trim();
    }

    public static <T> Mono<ImportResultDto> procesar(
            List<String[]> filas,
            int columnasEsperadas,
            BiFunction<String[], Integer, T> mapper,
            Validator validator,
            Function<T, Mono<T>> persistFn) {

        List<String> errores = Collections.synchronizedList(new ArrayList<>());
        int[] contador = {1}; // 1 = cabecera

        return Flux.fromIterable(filas)
                .concatMap(c -> {
                    int n = ++contador[0];
                    if (c.length < columnasEsperadas) {
                        errores.add("Fila " + n + ": columnas insuficientes (" + c.length + "/" + columnasEsperadas + ").");
                        return Mono.just(0);
                    }

                    T entidad;
                    try {
                        entidad = mapper.apply(c, n);
                    } catch (BusinessValidationException e) {
                        errores.add(e.getMessage());
                        return Mono.just(0);
                    } catch (Exception e) {
                        errores.add("Fila " + n + ": error al procesar datos: " + e.getMessage());
                        return Mono.just(0);
                    }

                    if (validator != null) {
                        Set<ConstraintViolation<T>> violaciones = validator.validate(entidad);
                        if (!violaciones.isEmpty()) {
                            String msg = violaciones.iterator().next().getMessage();
                            errores.add("Fila " + n + ": " + msg);
                            return Mono.just(0);
                        }
                    }

                    return persistFn.apply(entidad)
                            .map(ok -> 1)
                            .onErrorResume(e -> {
                                errores.add("Fila " + n + ": " + (MongoValidacionUtil.esValidacionMongo(e)
                                        ? MongoValidacionUtil.traducir(e) : e.getMessage()));
                                return Mono.just(0);
                            });
                })
                .reduce(0, Integer::sum)
                .map(ok -> new ImportResultDto(filas.size(), ok, filas.size() - ok, errores));
    }

    public static BigDecimal decimal(String val, String campo) {
        if (val == null || val.isBlank()) return null;
        try {
            return new BigDecimal(val.trim());
        } catch (NumberFormatException e) {
            throw new BusinessValidationException("El campo '" + campo + "' debe ser un valor decimal válido.");
        }
    }

    public static Integer entero(String val, String campo) {
        if (val == null || val.isBlank()) return null;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            throw new BusinessValidationException("El campo '" + campo + "' debe ser un número entero válido.");
        }
    }

    public static LocalDate fecha(String val, String campo) {
        if (val == null || val.isBlank()) return null;
        try {
            return LocalDate.parse(val.trim());
        } catch (DateTimeParseException e) {
            throw new BusinessValidationException("El campo '" + campo + "' debe tener formato de fecha yyyy-MM-dd.");
        }
    }

    public static String nvl(String s) {
        return s == null ? "" : s;
    }

    public static byte[] crearExcel(String tituloHoja, String[] cabeceras, List<Object[]> filas) throws Exception {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet(tituloHoja);

            CellStyle estiloHeader = wb.createCellStyle();
            Font negrita = wb.createFont();
            negrita.setBold(true);
            estiloHeader.setFont(negrita);

            Row header = sheet.createRow(0);
            for (int i = 0; i < cabeceras.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cabeceras[i]);
                cell.setCellStyle(estiloHeader);
            }

            int r = 1;
            for (Object[] fila : filas) {
                Row row = sheet.createRow(r++);
                for (int col = 0; col < fila.length; col++) {
                    Cell cell = row.createCell(col);
                    Object valor = fila[col];
                    if (valor == null) {
                        cell.setCellValue("");
                    } else if (valor instanceof Number num) {
                        cell.setCellValue(num.doubleValue());
                    } else if (valor instanceof Boolean b) {
                        cell.setCellValue(Boolean.TRUE.equals(b) ? "SI" : "NO");
                    } else {
                        cell.setCellValue(valor.toString());
                    }
                }
            }

            for (int i = 0; i < cabeceras.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    public static byte[] htmlAPdf(String html) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.withHtmlContent(html, null);
        builder.toStream(out);
        builder.run();
        return out.toByteArray();
    }
}
