import os
import re
import markdown

BASE_DIR = r"E:\Nueva carpeta (8)\tcc"
MD_PATH = os.path.join(BASE_DIR, "despliegue-aws", "MANUAL_RAPIDO.md")
HTML_PATH = os.path.join(BASE_DIR, "despliegue-aws", "MANUAL_RAPIDO.html")
ROOT_HTML_PATH = os.path.join(BASE_DIR, "MANUAL_RAPIDO_AWS.html")

def build_html():
    print(f"Leyendo Markdown desde: {MD_PATH}")
    with open(MD_PATH, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Pre-procesamiento de markdown:
    # 1. Convertir listas con [ ] o ☐ a un marcador especial para checkboxes interactivos
    md_processed = re.sub(r'^\s*-\s*\[\s*\]\s+(.+)$', r'- <span class="task-box"><input type="checkbox" class="step-check"> <span class="task-text">\1</span></span>', md_text, flags=re.MULTILINE)
    md_processed = re.sub(r'\|\s*☐\s*\|', r'|<input type="checkbox" class="step-check">|', md_processed)

    # Convertir markdown a HTML
    html_body = markdown.markdown(
        md_processed,
        extensions=[
            'tables',
            'fenced_code',
            'codehilite',
            'nl2br',
            'sane_lists'
        ]
    )

    # Post-procesamiento: agregar botones de copiar a bloques <pre><code>
    def add_copy_button(match):
        code_block = match.group(0)
        return f'<div class="code-wrapper"><div class="code-header"><span class="mac-dot red"></span><span class="mac-dot yellow"></span><span class="mac-dot green"></span><button class="copy-btn" onclick="copyCode(this)">📋 Copiar</button></div>{code_block}</div>'

    html_body = re.sub(r'<pre><code(?: class="[^"]*")?>.*?</code></pre>', add_copy_button, html_body, flags=re.DOTALL)

    # Plantilla HTML con diseño Enterprise
    template = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manual Rápido Clic por Clic — AgroPacayales en AWS (K3s)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --primary: #059669;
      --primary-dark: #047857;
      --primary-light: #d1fae5;
      --accent: #d97706;
      --dark-slate: #0f172a;
      --surface: #ffffff;
      --bg: #f8fafc;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --code-bg: #0f172a;
      --warning-bg: #fffbeb;
      --warning-border: #f59e0b;
      --info-bg: #eff6ff;
      --info-border: #3b82f6;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.65;
      color: var(--text);
      background-color: var(--bg);
      padding: 24px 16px 80px 16px;
    }}

    .container {{
      max-width: 1080px;
      margin: 0 auto;
      background: var(--surface);
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid var(--border);
      overflow: hidden;
    }}

    /* Top Banner */
    .top-hero {{
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      color: #ffffff;
      padding: 40px 48px;
      position: relative;
    }}
    .top-hero h1 {{
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }}
    .badge-bar {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.01em;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }}
    .badge-gold {{
      background: #fbbf24;
      color: #78350f;
      border: none;
    }}

    /* Quick Progress Bar */
    .progress-bar-container {{
      background: #e2e8f0;
      height: 8px;
      width: 100%;
      position: sticky;
      top: 0;
      z-index: 100;
    }}
    .progress-fill {{
      background: linear-gradient(90deg, #10b981, #059669);
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
    }}
    .progress-info {{
      background: #f1f5f9;
      padding: 12px 48px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13.5px;
      font-weight: 500;
      color: var(--text-muted);
    }}
    .btn-reset {{
      background: transparent;
      border: 1px solid #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      color: var(--text-muted);
      transition: all 0.2s;
    }}
    .btn-reset:hover {{
      background: #fee2e2;
      border-color: #fca5a5;
      color: #991b1b;
    }}

    /* Content Layout */
    .content-body {{
      padding: 48px;
    }}

    h1, h2, h3, h4 {{
      color: var(--dark-slate);
      font-weight: 700;
      letter-spacing: -0.01em;
    }}

    h2 {{
      font-size: 22px;
      margin-top: 44px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    h3 {{
      font-size: 17px;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #1e40af;
    }}

    p {{
      margin-bottom: 14px;
      font-size: 15px;
      color: #334155;
    }}

    ul, ol {{
      margin-bottom: 20px;
      padding-left: 24px;
    }}

    li {{
      margin-bottom: 8px;
      font-size: 14.5px;
    }}

    /* Checklists */
    .task-box {{
      display: inline-flex;
      align-items: flex-start;
      gap: 10px;
      width: 100%;
      cursor: pointer;
      user-select: none;
    }}
    .step-check {{
      width: 18px;
      height: 18px;
      margin-top: 3px;
      accent-color: #059669;
      cursor: pointer;
      flex-shrink: 0;
    }}
    .task-text {{
      flex: 1;
    }}
    .checked-text {{
      text-decoration: line-through;
      color: #94a3b8;
    }}

    /* Tables */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0 28px 0;
      font-size: 13.5px;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
    }}
    th {{
      background-color: #f8fafc;
      color: #334155;
      font-weight: 600;
      text-align: left;
      padding: 12px 14px;
      border-bottom: 2px solid var(--border);
    }}
    td {{
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      color: #334155;
      vertical-align: middle;
    }}
    tr:nth-child(even) td {{
      background-color: #fbfcfe;
    }}
    tr:hover td {{
      background-color: #f1f5f9;
    }}

    /* Code Blocks with Terminal Look */
    .code-wrapper {{
      margin: 18px 0 26px 0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      border: 1px solid #1e293b;
      background: var(--code-bg);
    }}
    .code-header {{
      background: #1e293b;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #334155;
    }}
    .mac-dot {{
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: inline-block;
    }}
    .mac-dot.red {{ background: #ef4444; }}
    .mac-dot.yellow {{ background: #f59e0b; }}
    .mac-dot.green {{ background: #10b981; }}
    .copy-btn {{
      margin-left: auto;
      background: #334155;
      color: #f8fafc;
      border: none;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .copy-btn:hover {{
      background: #475569;
      color: #ffffff;
    }}
    .copy-btn.copied {{
      background: #059669;
      color: #ffffff;
    }}

    pre {{
      margin: 0;
      padding: 16px 20px;
      overflow-x: auto;
      background: var(--code-bg);
      color: #e2e8f0;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
    }}
    code {{
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 13px;
      color: #e11d48;
      background-color: #ffe4e6;
      padding: 2px 6px;
      border-radius: 4px;
    }}
    pre code {{
      color: inherit;
      background: transparent;
      padding: 0;
    }}

    /* Quotes & Callouts */
    blockquote {{
      margin: 20px 0;
      padding: 16px 20px;
      border-left: 4px solid var(--primary);
      background-color: var(--primary-light);
      color: #065f46;
      border-radius: 0 8px 8px 0;
      font-size: 14.5px;
    }}
    blockquote p {{
      margin-bottom: 0;
      color: inherit;
    }}

    /* Floating Navigation Tool */
    .floating-tools {{
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
    }}
    .fab-btn {{
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #334155;
      padding: 10px 18px;
      border-radius: 9999px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      text-decoration: none;
    }}
    .fab-btn:hover {{
      background: #059669;
      transform: translateY(-2px);
    }}

    /* Print styling */
    @media print {{
      body {{
        padding: 0;
        background: #ffffff;
      }}
      .container {{
        box-shadow: none;
        border: none;
      }}
      .floating-tools, .progress-bar-container, .progress-info, .copy-btn {{
        display: none !important;
      }}
      pre {{
        white-space: pre-wrap;
        word-break: break-all;
      }}
    }}
  </style>
</head>
<body>

  <div class="container">
    <div class="top-hero">
      <h1>🚀 Manual Rápido Clic por Clic — AgroPacayales en AWS</h1>
      <p style="color: #a7f3d0; margin-bottom: 0;">Despliegue integral K3s sobre Amazon EC2 + Amazon RDS SQL Server + Amazon EC2 MongoDB</p>
      <div class="badge-bar">
        <span class="badge badge-gold">⭐ Rúbrica 20/20</span>
        <span class="badge">☁️ AWS Academy (Voclabs)</span>
        <span class="badge">☸️ Kubernetes (K3s)</span>
        <span class="badge">📌 IP Elástica Persistente</span>
        <span class="badge">⏱ 20–25 Minutos</span>
      </div>
    </div>

    <div class="progress-bar-container">
      <div class="progress-fill" id="progressFill"></div>
    </div>
    <div class="progress-info">
      <span id="progressText">Progreso: 0 de 0 pasos completados (0%)</span>
      <button class="btn-reset" onclick="resetProgress()">Reiniciar Checklist</button>
    </div>

    <div class="content-body">
      {html_body}
    </div>
  </div>

  <div class="floating-tools">
    <a href="#" class="fab-btn">⬆ Subir al inicio</a>
  </div>

  <script>
    // Sistema interactivo de checklist con persistencia en localStorage
    const STORAGE_KEY = 'agropacayales_k8s_checklist';
    const checkboxes = document.querySelectorAll('.step-check');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    function updateProgress() {{
      const total = checkboxes.length;
      let checkedCount = 0;
      const state = [];

      checkboxes.forEach((cb, index) => {{
        if (cb.checked) {{
          checkedCount++;
          state.push(index);
          const taskText = cb.closest('li')?.querySelector('.task-text');
          if (taskText) taskText.classList.add('checked-text');
        }} else {{
          const taskText = cb.closest('li')?.querySelector('.task-text');
          if (taskText) taskText.classList.remove('checked-text');
        }}
      }});

      const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
      if (progressFill) progressFill.style.width = percent + '%';
      if (progressText) progressText.textContent = `Progreso: ${{checkedCount}} de ${{total}} pasos completados (${{percent}}%)`;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }}

    function loadProgress() {{
      try {{
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        saved.forEach(index => {{
          if (checkboxes[index]) {{
            checkboxes[index].checked = true;
          }}
        }});
      }} catch (e) {{
        console.warn('Error loading checklist state', e);
      }}
      updateProgress();
    }}

    function resetProgress() {{
      if (confirm('¿Deseas reiniciar todas las casillas de verificación?')) {{
        checkboxes.forEach(cb => cb.checked = false);
        updateProgress();
      }}
    }}

    checkboxes.forEach(cb => {{
      cb.addEventListener('change', updateProgress);
    }});

    // Función para copiar código al portapapeles
    function copyCode(btn) {{
      const pre = btn.closest('.code-wrapper').querySelector('pre');
      const text = pre.innerText || pre.textContent;
      navigator.clipboard.writeText(text).then(() => {{
        const oldText = btn.textContent;
        btn.textContent = '✅ ¡Copiado!';
        btn.classList.add('copied');
        setTimeout(() => {{
          btn.textContent = oldText;
          btn.classList.remove('copied');
        }}, 2000);
      }}).catch(err => {{
        console.error('Error al copiar', err);
      }});
    }}

    document.addEventListener('DOMContentLoaded', loadProgress);
  </script>
</body>
</html>
"""

    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(template)
    print(f"HTML generado exitosamente en: {HTML_PATH}")

    # También guardamos una copia en la raíz para acceso inmediato
    with open(ROOT_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(template)
    print(f"HTML duplicado en la raíz: {ROOT_HTML_PATH}")

if __name__ == "__main__":
    build_html()
