package Agropacayales.valleGrande.dto.response;

import java.util.List;

public record ImportResultDto(
        int totalFilas,
        int importados,
        int fallidos,
        List<String> errores
) {}
