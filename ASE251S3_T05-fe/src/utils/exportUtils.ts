/**
 * Utilidad de Exportación para AgroPacayales
 * - Descarga archivos oficiales generados por Backend Spring Boot (POI / iText)
 * - Fallback inteligente a generación CSV/Excel estructurado con BOM UTF-8
 */

export async function exportarExcel(
  endpoint: string,
  nombreArchivo: string,
  datosFallback: any[],
  columnasFallback: { header: string; key: string }[]
) {
  try {
    const token = localStorage.getItem('agro_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api${endpoint}/exportar/excel`, { headers });
    if (res.ok) {
      const blob = await res.blob();
      descargarBlob(blob, `${nombreArchivo}.xlsx`);
      return;
    }
  } catch (err) {
    console.warn('Backend export excel no disponible, usando fallback cliente:', err);
  }

  // Fallback CSV estructurado compatible con Excel
  if (datosFallback && datosFallback.length > 0) {
    const headers = columnasFallback.map((c) => `"${c.header}"`).join(',');
    const rows = datosFallback.map((item) =>
      columnasFallback
        .map((c) => {
          const val = item[c.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    descargarBlob(blob, `${nombreArchivo}.csv`);
  }
}

export async function exportarPdf(
  endpoint: string,
  nombreArchivo: string,
  tituloReporte: string,
  datosFallback: any[],
  columnasFallback: { header: string; key: string }[]
) {
  try {
    const token = localStorage.getItem('agro_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api${endpoint}/exportar/pdf`, { headers });
    if (res.ok) {
      const blob = await res.blob();
      descargarBlob(blob, `${nombreArchivo}.pdf`);
      return;
    }
  } catch (err) {
    console.warn('Backend export pdf no disponible, usando vista de impresión:', err);
  }

  // Fallback: Ventana de impresión limpia lista para Guardar como PDF
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const filasHtml = datosFallback
    .map(
      (item) => `
      <tr>
        ${columnasFallback.map((c) => `<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${item[c.key] ?? '-'}</td>`).join('')}
      </tr>`
    )
    .join('');

  const cabecerasHtml = columnasFallback
    .map((c) => `<th style="padding: 10px 12px; background: #1b4332; color: #fff; text-align: left; font-size: 11px;">${c.header}</th>`)
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${tituloReporte} - AgroPacayales S.A.C.</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
          .header { border-bottom: 2px solid #1b4332; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 20px; color: #1b4332; }
          p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          @media print { body { padding: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>AgroPacayales S.A.C.</h1>
            <p>${tituloReporte} • Sistema Integrado de Control Agrícola</p>
          </div>
          <p style="text-align: right;">Fecha: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}</p>
        </div>
        <table>
          <thead><tr>${cabecerasHtml}</tr></thead>
          <tbody>${filasHtml}</tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
