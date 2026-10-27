import os
import re
import markdown
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = r"E:\Nueva carpeta (8)\tcc"
MD_PATH = os.path.join(BASE_DIR, "MANUAL_DESPLIEGUE_K3S_AWS.md")
HTML_PATH = os.path.join(BASE_DIR, "MANUAL_DESPLIEGUE_K3S_AWS.html")
DOCX_PATH = os.path.join(BASE_DIR, "MANUAL_DESPLIEGUE_K3S_AWS.docx")

def compilar_html():
    print("[1/2] Compilando HTML a partir de Markdown...")
    with open(MD_PATH, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Convertir markdown con extensiones para tablas, bloques de código delimitados y atributos
    html_body = markdown.markdown(
        md_text,
        extensions=[
            'tables',
            'fenced_code',
            'codehilite',
            'nl2br',
            'sane_lists'
        ]
    )

    full_html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Manual Maestro de Despliegue y Sustentación K3s AWS — AgroPacayales S.A.C.</title>
<style>
  :root {{
    --earth-dark: #1A110B;
    --emerald-primary: #10B981;
    --emerald-dark: #065F46;
    --terracotta: #C28D66;
    --bg-surface: #FDFBF9;
    --border-sand: #E7DFD5;
    --text-primary: #1E293B;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.65;
    color: var(--text-primary);
    background-color: #F3EFEA;
    margin: 0;
    padding: 30px 16px;
  }}
  .container {{
    max-width: 1040px;
    margin: 0 auto;
    background: #FFFFFF;
    padding: 50px 60px;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(26, 17, 11, 0.1), 0 8px 10px -6px rgba(26, 17, 11, 0.05);
    border: 1px solid var(--border-sand);
  }}
  h1 {{
    color: var(--earth-dark);
    font-size: 28px;
    font-weight: 800;
    border-bottom: 3px solid var(--emerald-primary);
    padding-bottom: 16px;
    margin-top: 0;
    letter-spacing: -0.02em;
  }}
  h2 {{
    color: var(--earth-dark);
    font-size: 21px;
    font-weight: 800;
    margin-top: 40px;
    border-left: 5px solid var(--emerald-primary);
    padding-left: 14px;
    background: rgba(16, 185, 129, 0.06);
    padding-top: 8px;
    padding-bottom: 8px;
    border-radius: 0 8px 8px 0;
  }}
  h3 {{
    color: #0369a1;
    font-size: 17px;
    font-weight: 700;
    margin-top: 26px;
    border-bottom: 1px dashed var(--border-sand);
    padding-bottom: 6px;
  }}
  h4 {{
    color: #92400e;
    font-size: 15px;
    margin-top: 18px;
  }}
  p, li {{
    font-size: 14.5px;
    color: #334155;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 22px 0;
    font-size: 13.5px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }}
  th {{
    background-color: var(--earth-dark);
    color: #FFFFFF;
    text-align: left;
    padding: 11px 14px;
    font-weight: 700;
    border-bottom: 2px solid var(--emerald-primary);
  }}
  td {{
    padding: 9px 14px;
    border-bottom: 1px solid var(--border-sand);
    vertical-align: top;
  }}
  tr:nth-child(even) {{
    background-color: #FAF7F2;
  }}
  tr:hover {{
    background-color: #F1ECE4;
  }}
  pre {{
    background: #140E0A;
    color: #E2E8F0;
    padding: 16px 18px;
    border-radius: 10px;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    line-height: 1.5;
    border: 1px solid rgba(194, 141, 102, 0.3);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
    margin: 16px 0;
  }}
  code {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    background: #F4EFEB;
    color: #9A3412;
    padding: 2px 6px;
    border-radius: 5px;
    font-weight: 600;
  }}
  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
    font-weight: normal;
  }}
  blockquote {{
    border-left: 4px solid var(--terracotta);
    background-color: #FDF9F5;
    padding: 12px 18px;
    margin: 18px 0;
    border-radius: 0 8px 8px 0;
    color: #431407;
  }}
  hr {{
    border: 0;
    height: 1px;
    background: var(--border-sand);
    margin: 35px 0;
  }}
  @media print {{
    body {{ background: #fff; padding: 0; }}
    .container {{ box-shadow: none; border: none; padding: 0; max-width: 100%; }}
    pre {{ page-break-inside: avoid; }}
    table {{ page-break-inside: avoid; }}
    h2, h3 {{ page-break-after: avoid; }}
  }}
</style>
</head>
<body>
<div class="container">
{html_body}
</div>
</body>
</html>
"""
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"HTML generado exitosamente en: {HTML_PATH}")

def compilar_docx():
    print("[2/2] Compilando DOCX a partir de Markdown...")
    with open(MD_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    doc = docx.Document()

    # Configurar márgenes
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Estilos de título principal
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(8)
    run = title_p.add_run("Manual Maestro de Despliegue, Operación y Sustentación")
    run.font.name = "Calibri"
    run.font.size = Pt(22)
    run.font.bold = True
    run.font.color.rgb = RGBColor(26, 17, 11)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(16)
    sub_run = sub_p.add_run("AgroPacayales S.A.C. — Arquitectura de Microservicios Políglotas sobre Kubernetes K3s (AWS)")
    sub_run.font.size = Pt(12)
    sub_run.font.color.rgb = RGBColor(16, 185, 129)
    sub_run.font.bold = True

    in_code_block = False
    code_lines = []
    in_table = False
    table_lines = []

    def flush_code():
        nonlocal code_lines
        if not code_lines:
            return
        code_text = "".join(code_lines).rstrip()
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.left_indent = Inches(0.2)
        r = p.add_run(code_text)
        r.font.name = "Consolas"
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(30, 41, 59)
        code_lines = []

    def flush_table():
        nonlocal table_lines
        if not table_lines:
            return
        # Parse table markdown
        rows_data = []
        for tl in table_lines:
            if re.match(r'^\s*\|?\s*[-:]+\s*\|', tl):
                continue
            cols = [c.strip() for c in tl.strip().strip('|').split('|')]
            if cols and any(cols):
                rows_data.append(cols)
        
        if rows_data:
            num_cols = max(len(r) for r in rows_data)
            tbl = doc.add_table(rows=len(rows_data), cols=num_cols)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            tbl.autofit = True

            for r_idx, row in enumerate(rows_data):
                for c_idx in range(num_cols):
                    val = row[c_idx] if c_idx < len(row) else ""
                    cell = tbl.cell(r_idx, c_idx)
                    cell.text = val
                    # Estilo celda
                    cp = cell.paragraphs[0]
                    cp.paragraph_format.space_before = Pt(2)
                    cp.paragraph_format.space_after = Pt(2)
                    for crun in cp.runs:
                        crun.font.name = "Calibri"
                        crun.font.size = Pt(9.5)
                        if r_idx == 0:
                            crun.font.bold = True
                            crun.font.color.rgb = RGBColor(255, 255, 255)
                    if r_idx == 0:
                        shading_elm = parse_xml(r'<w:shd {} w:fill="1A110B"/>'.format(nsdecls('w')))
                        cell._tc.get_or_add_tcPr().append(shading_elm)
                    elif r_idx % 2 == 1:
                        shading_elm = parse_xml(r'<w:shd {} w:fill="F9F7F5"/>'.format(nsdecls('w')))
                        cell._tc.get_or_add_tcPr().append(shading_elm)

            doc.add_paragraph().paragraph_format.space_after = Pt(6)
        table_lines = []

    for line in lines:
        stripped = line.strip()

        # Bloques de código
        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                flush_code()
            else:
                if in_table:
                    in_table = False
                    flush_table()
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Tablas Markdown
        if stripped.startswith("|") and stripped.endswith("|"):
            in_table = True
            table_lines.append(stripped)
            continue
        elif in_table:
            in_table = False
            flush_table()

        # Encabezados
        if stripped.startswith("# "):
            continue # ya pusimos titulo
        elif stripped.startswith("## "):
            h = doc.add_paragraph()
            h.paragraph_format.space_before = Pt(16)
            h.paragraph_format.space_after = Pt(4)
            h.paragraph_format.keep_with_next = True
            hrun = h.add_run(stripped[3:].strip())
            hrun.font.name = "Calibri"
            hrun.font.size = Pt(15)
            hrun.font.bold = True
            hrun.font.color.rgb = RGBColor(16, 185, 129)
        elif stripped.startswith("### "):
            h = doc.add_paragraph()
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(3)
            h.paragraph_format.keep_with_next = True
            hrun = h.add_run(stripped[4:].strip())
            hrun.font.name = "Calibri"
            hrun.font.size = Pt(12.5)
            hrun.font.bold = True
            hrun.font.color.rgb = RGBColor(3, 105, 161)
        elif stripped.startswith("#### "):
            h = doc.add_paragraph()
            h.paragraph_format.space_before = Pt(8)
            h.paragraph_format.space_after = Pt(2)
            h.paragraph_format.keep_with_next = True
            hrun = h.add_run(stripped[5:].strip())
            hrun.font.name = "Calibri"
            hrun.font.size = Pt(11)
            hrun.font.bold = True
            hrun.font.color.rgb = RGBColor(146, 64, 14)
        elif stripped.startswith("- ") or stripped.startswith("* "):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            prun = p.add_run(stripped[2:])
            prun.font.name = "Calibri"
            prun.font.size = Pt(10)
        elif re.match(r'^\d+\.\s', stripped):
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            content_txt = re.sub(r'^\d+\.\s', '', stripped)
            prun = p.add_run(content_txt)
            prun.font.name = "Calibri"
            prun.font.size = Pt(10)
        elif stripped.startswith("> "):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.left_indent = Inches(0.2)
            prun = p.add_run(stripped[2:])
            prun.font.name = "Calibri"
            prun.font.italic = True
            prun.font.size = Pt(10)
            prun.font.color.rgb = RGBColor(120, 53, 15)
        elif stripped == "---":
            continue
        elif stripped:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(4)
            # Quitar marcas markdown simples
            clean_txt = re.sub(r'\*\*(.*?)\*\*', r'\1', stripped)
            clean_txt = re.sub(r'\*(.*?)\*', r'\1', clean_txt)
            clean_txt = re.sub(r'`(.*?)`', r'\1', clean_txt)
            prun = p.add_run(clean_txt)
            prun.font.name = "Calibri"
            prun.font.size = Pt(10)

    if in_code_block:
        flush_code()
    if in_table:
        flush_table()

    doc.save(DOCX_PATH)
    print(f"DOCX generado exitosamente en: {DOCX_PATH}")

if __name__ == "__main__":
    compilar_html()
    compilar_docx()
    print("Compilación finalizada con éxito.")
