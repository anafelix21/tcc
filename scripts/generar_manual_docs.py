import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_manual_docx(filename):
    doc = docx.Document()
    
    # Page setup - Margins 1 inch
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Styles
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)
    
    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_title.add_run("AGROPACAYALES S.A.C. — MANUAL TÉCNICO OFICIAL\n")
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(5, 150, 105)
    
    run_title = p_title.add_run("Manual Maestro de Despliegue en AWS K3s\nPersistencia Políglota, Microservicios y Frontend React")
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)
    
    # Subtitle box
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(20)
    run_meta = p_meta.add_run("Docker Hub: hugo454 | Tag Oficial: :2.0 | Namespace K8s: agropacayales-namespace\nEquipo PIT: Hugo Fernández (#07) • Ana Félix (#05) • Axel Huapaya (#10)")
    run_meta.font.size = Pt(9.5)
    run_meta.font.italic = True
    run_meta.font.color.rgb = RGBColor(100, 116, 139)

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor(27, 67, 50) # Deep Forest Green
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = RGBColor(2, 132, 199) # Blue accent
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(71, 85, 105)
        return p

    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.9)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.1
        run = p.add_run(code_text.strip())
        run.font.name = 'Consolas'
        run.font.size = Pt(9.0)
        run.font.color.rgb = RGBColor(15, 23, 42)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_callout(title, text, bg_hex="ECFDF5", border_hex="10B981"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.9)
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r_title = p.add_run(f"📌 {title}: ")
        r_title.font.bold = True
        r_title.font.size = Pt(9.5)
        r_title.font.color.rgb = RGBColor(15, 23, 42)
        r_text = p.add_run(text)
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = RGBColor(51, 65, 85)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # SECCIÓN 1: INTRODUCCIÓN Y REPARTO
    # -------------------------------------------------------------
    add_heading_1("1. Asignación del Equipo y Módulos Maestros")
    doc.add_paragraph(
        "Este manual describe paso a paso el procedimiento completo para replicar el entorno de producción "
        "en cualquier máquina (desde tu laptop personal o una PC del instituto desde cero). "
        "El sistema AgroPacayales S.A.C. utiliza persistencia políglota y frontend React 19 con arquitectura basada en características:"
    )

    t1 = doc.add_table(rows=4, cols=5)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Integrante", "Código", "Módulo Maestro", "Backend 1 (Spring)", "Colección MongoDB"]
    for i, h in enumerate(headers):
        cell = t1.cell(0, i)
        set_cell_background(cell, "1B4332")
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9.5)

    data1 = [
        ["Hugo Fernández", "#07", "Insumos Agrícolas (/insumos)", "/api/insumos", "supplies (200 registros)"],
        ["Ana Félix", "#05", "Parcelas de Cultivo (/parcelas)", "/api/parcelas", "plots (160 registros)"],
        ["Axel Huapaya", "#10", "Usuarios y Personal (/usuarios)", "/api/usuarios", "users (150 registros)"],
    ]
    for row_idx, row in enumerate(data1):
        for col_idx, val in enumerate(row):
            cell = t1.cell(row_idx + 1, col_idx)
            set_cell_background(cell, "F8FAFC" if row_idx % 2 == 0 else "FFFFFF")
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9.0)
            if col_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # SECCIÓN 2: ARQUITECTURA Y TOPOLOGÍA
    # -------------------------------------------------------------
    add_heading_1("2. Arquitectura de Red y Puertos en AWS")
    doc.add_paragraph(
        "El despliegue está dividido en 5 instancias EC2 dentro de la misma VPC predeterminada, "
        "con bases de datos desacopladas de los pods de cómputo:"
    )
    
    add_code_block(
"""[USUARIO EXTERNO / DOCENTE]
    |
    +---> http://<IP_FRONTEND>:30000 --------> Frontend React 19 + Nginx
    +---> http://<IP_BACKEND1>:30001 --------> Swagger UI Spring WebFlux
    +---> http://<IP_ANALITICO>:30002 -------> OpenAPI Docs Flask + Pandas
    |
[VPC AWS 172.31.0.0/16]
  • k8s-master                  (Control Plane K3s - t3.small)
  • k8s-node-frontend           (role=frontend     - t3.small)
  • k8s-node-backend            (role=backend1     - t3.medium)
  • k8s-node-backendAnalitico   (role=backend2     - t3.small)
  • ec2-mongodb                 (MongoDB 8.0       - t3.small)
  • Amazon RDS SQL Server       (db.t3.micro       - Puerto 1433)"""
    )

    # -------------------------------------------------------------
    # SECCIÓN 3: REQUISITOS Y CREDENCIALES
    # -------------------------------------------------------------
    add_heading_1("3. Tabla Rápida de Credenciales y Parámetros")
    t2 = doc.add_table(rows=8, cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    h2 = ["Servicio / Componente", "Parámetro Clave", "Valor Obligatorio"]
    for i, h in enumerate(h2):
        cell = t2.cell(0, i)
        set_cell_background(cell, "0284C7")
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9.5)

    params = [
        ["Docker Hub", "Usuario / Tag Oficial", "hugo454 / tag: :2.0"],
        ["RDS SQL Server", "Base / Usuario / Password", "agropacayales_db | admin | AgroPacayales2026!"],
        ["RDS SQL Server", "Puerto TCP", "1433 (Sin acceso público directo)"],
        ["MongoDB EC2", "Base / Usuario / Password", "agropacayales_db | admin | Mongo12345"],
        ["MongoDB EC2", "Puerto TCP / Autenticación", "27017 | authSource=admin"],
        ["K3s Clúster Token", "K3S_TOKEN fijo", "agropacayales-token-2026"],
        ["Puertos NodePort", "Frontend / Back1 / Back2", "30000 / 30001 / 30002"],
    ]
    for row_idx, row in enumerate(params):
        for col_idx, val in enumerate(row):
            cell = t2.cell(row_idx + 1, col_idx)
            set_cell_background(cell, "F8FAFC" if row_idx % 2 == 0 else "FFFFFF")
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9.0)
            if col_idx == 1:
                r.font.name = 'Consolas'

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # SECCIÓN 4: PASO A PASO DETALLADO
    # -------------------------------------------------------------
    add_heading_1("4. Guía de Ejecución Paso a Paso")

    add_heading_2("Paso 1: Crear Amazon RDS SQL Server (Toma 10-15 min)")
    add_callout("ORDEN DE EJECUCIÓN", "Inicia la creación de RDS primero en AWS, ya que tarda unos 12 minutos mientras avanzas con los grupos de seguridad e instancias.", "FEF3C7", "F59E0B")
    doc.add_paragraph(
        "1. Ve a AWS Console en español → escribe 'RDS' → Bases de datos → Crear base de datos.\n"
        "2. Método: Creación estándar | Motor: Microsoft SQL Server | Edición: SQL Server Express Edition.\n"
        "3. Identificador de base de datos: agropacayales-rds-sqlserver\n"
        "4. Usuario maestro: admin | Contraseña maestra: AgroPacayales2026!\n"
        "5. Clase de instancia: Clases ampliables → db.t3.micro (1 vCPU, 1 GiB RAM).\n"
        "6. Almacenamiento: gp3, 20 GiB. Desmarcar 'Habilitar escalado automático de almacenamiento'.\n"
        "7. Conectividad: VPC predeterminada | Acceso público: NO | Grupo de seguridad: Crear nuevo llamado evi-rds-sg.\n"
        "8. Desmarcar copias de seguridad automáticas y clic en Crear base de datos.\n"
        "9. Una vez en estado Disponible, copia el Punto de enlace (Endpoint)."
    )

    add_heading_2("Paso 2: Configurar Grupos de Seguridad (Security Groups)")
    doc.add_paragraph(
        "Ve a EC2 → Grupos de seguridad → botón Crear grupo de seguridad:\n"
        "• evi-ec2-sg (para las 5 instancias EC2):\n"
        "  - Regla SSH (puerto 22): 0.0.0.0/0 (Cualquier lugar IPv4)\n"
        "  - Regla TCP personalizado (puertos 30000 - 30002): 0.0.0.0/0 (Para acceder a Frontend y APIs)\n"
        "  - Regla TCP personalizado (puerto 6443): Origen = evi-ec2-sg (API K3s)\n"
        "  - Regla TCP personalizado (puerto 10250): Origen = evi-ec2-sg (Kubelet)\n"
        "  - Regla UDP personalizado (puerto 8472): Origen = evi-ec2-sg (Flannel red de pods)\n"
        "  - Regla TCP personalizado (puerto 27017): Origen = evi-ec2-sg (MongoDB VPC)\n"
        "• evi-rds-sg (para SQL Server RDS):\n"
        "  - Regla MSSQL (puerto 1433): Origen = evi-ec2-sg (Solo las EC2 tienen acceso)"
    )

    add_heading_2("Paso 3: Lanzar las 5 Instancias EC2 con User Data")
    doc.add_paragraph(
        "Lanza 5 instancias con AMI Ubuntu 24.04 LTS (x86_64), IP pública habilitada y grupo evi-ec2-sg:\n"
        "1. ec2-mongodb (t3.small): En 'Detalles avanzados' → 'Datos de usuario' pega el script del instalador con el parche de kernel rseq=1 (ver abajo).\n"
        "2. k8s-master (t3.small): En 'Datos de usuario' pega el script de instalación de K3s Server.\n"
        "3. k8s-node-frontend (t3.small): Sin datos de usuario.\n"
        "4. k8s-node-backend (t3.medium): Sin datos de usuario (4 GB RAM requeridos para Spring Boot).\n"
        "5. k8s-node-backendAnalitico (t3.small): Sin datos de usuario."
    )

    add_heading_3("Script User Data para ec2-mongodb:")
    add_code_block(
"""#!/bin/bash
set -e
apt-get update && apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
apt-get update && apt-get install -y mongodb-org

# Parche rseq para Ubuntu 24.04
mkdir -p /etc/systemd/system/mongod.service.d
printf '[Service]\\nEnvironment="GLIBC_TUNABLES=glibc.pthread.rseq=1"\\n' > /etc/systemd/system/mongod.service.d/rseq.conf
systemctl daemon-reload

sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
systemctl enable --now mongod
sleep 6

mongosh --eval 'db.getSiblingDB("admin").createUser({user:"admin",pwd:"Mongo12345",roles:["root"]})'
printf "\\nsecurity:\\n  authorization: enabled\\n" >> /etc/mongod.conf
systemctl restart mongod
apt-mark hold linux-aws linux-image-aws linux-headers-aws"""
    )

    add_heading_3("Script User Data para k8s-master:")
    add_code_block(
"""#!/bin/bash
set -e
curl -sfL https://get.k3s.io | K3S_TOKEN="agropacayales-token-2026" sh -s - server --write-kubeconfig-mode 644
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
echo 'export KUBECONFIG=/home/ubuntu/.kube/config' >> /home/ubuntu/.bashrc
apt-get update && apt-get install -y netcat-openbsd curl jq"""
    )

    add_heading_2("Paso 4: Unir los 3 Workers al Clúster y Etiquetar")
    doc.add_paragraph("1. En cada uno de los 3 workers (frontend, backend, analitico), entra por SSH y ejecuta:")
    add_code_block('curl -sfL https://get.k3s.io | K3S_URL=https://<IP_PRIVADA_MASTER>:6443 K3S_TOKEN="agropacayales-token-2026" sh -')
    doc.add_paragraph("2. En k8s-master, ejecuta para etiquetar según nodeSelector:")
    add_code_block(
"""# Comprobar nombres de nodos
kubectl get nodes

# Etiquetar cada worker
kubectl label node <NOMBRE_NODO_FRONTEND> role=frontend
kubectl label node <NOMBRE_NODO_BACKEND> role=backend1
kubectl label node <NOMBRE_NODO_BACKEND_ANALITICO> role=backend2

# Verificar
kubectl get nodes -L role"""
    )

    add_heading_2("Paso 5: Poblar las Bases de Datos (Método para la PC del Instituto)")
    add_callout("CASO PC DEL INSTITUTO", "En la PC del instituto no tienes acceso a rutas como 'E:\\Nueva carpeta', ni tienes mongosh instalado en Windows. Sigue estos pasos garantizados sin dependencias locales.", "EFF6FF", "3B82F6")
    
    doc.add_paragraph(
        "A) Para SQL Server (RDS):\n"
        "1. Abre una terminal local en Windows y levanta el túnel SSH con tu clave k8s-master.pem:\n"
        "   ssh -i k8s-master.pem -N -L 1433:<ENDPOINT_RDS>:1433 -L 27017:<IP_PRIVADA_MONGO>:27017 ubuntu@<IP_PUBLICA_MASTER>\n"
        "   Ejemplo directo listo para copiar:\n"
        "   ssh -i k8s-master.pem -N -L 1433:agropacayales-rds-sqlserver.c4rhnptakjkc.us-east-1.rds.amazonaws.com:1433 -L 27017:172.31.26.155:27017 ubuntu@13.218.110.179\n"
        "2. Abre SSMS o Azure Data Studio, conéctate a 'localhost,1433' (user: admin / pass: AgroPacayales2026!).\n"
        "3. Copia el contenido de 'init_sqlserver_completo.sql' y ejecútalo."
    )

    doc.add_paragraph(
        "B) Para MongoDB (Directo en la EC2):\n"
        "1. Conéctate por SSH directo a la máquina de MongoDB con tu clave k8s-master.pem:\n"
        "   ssh -i k8s-master.pem ubuntu@<IP_PUBLICA_EC2_MONGODB>\n"
        "2. Crea el archivo directamente pegando el script con cat:\n"
        "   cat << 'EOF' > init_mongodb.js\n"
        "   [Pega aquí el contenido de init_mongodb_completo.js]\n"
        "   EOF\n"
        "3. Ejecútalo dentro de la máquina:\n"
        "   mongosh \"mongodb://admin:Mongo12345@localhost:27017/?authSource=admin\" init_mongodb.js\n"
        "4. Debe responder: Insertados 200 insumos, 160 parcelas y 150 usuarios exitosamente."
    )

    add_heading_2("Paso 6: Desplegar en Kubernetes (agropacayales.yml)")
    doc.add_paragraph("En k8s-master, crea el manifiesto y aplica:")
    add_code_block(
"""# En k8s-master
nano agropacayales.yml
# (Pega el manifiesto asegurándote de usar las imágenes :2.0)

kubectl apply -f agropacayales.yml

# Verificar pods en tiempo real
kubectl get pods -n agropacayales-namespace -o wide -w"""
    )
    doc.add_paragraph("Debes ver los 3 pods en estado Running distribuidos en sus respectivos 3 nodos.")

    add_heading_2("Paso 7: Correcciones Aplicadas (Red K3s, Nginx y MongoDB)")
    doc.add_paragraph(
        "Durante el Sprint se aplicaron correcciones críticas para garantizar alta disponibilidad:\n"
        "1. Swagger UI Backend 2 ('Failed to fetch'): Se eliminó la propiedad estática 'host: 127.0.0.1:5000' en swagger.json para utilizar automáticamente 'window.location.host', permitiendo invocar la API desde cualquier IP pública de AWS.\n"
        "2. Nginx DNS Resolver: Se depuró nginx.conf eliminando el resolver '127.0.0.11:53' (Docker Compose) y fijando CoreDNS ('10.43.0.10') con FQDNs completos y timeouts de proxy de 5s/15s.\n"
        "3. Solución a Timeout Inter-Nodos (Flannel VXLAN UDP 8472): Al estar los pods en distintas EC2, se desbloqueó el puerto UDP 8472 en el Security Group de AWS para la VPC 172.31.0.0/16, y se co-localizó el frontend en el nodo backend ('role=backend1') para tráfico localhost de alta velocidad.\n"
        "4. Purga Total de Mocks: Los servicios del frontend se conectan directamente a MongoDB y SQL Server sin arreglos falsos en memoria.\n"
        "5. Exportación a Excel y PDF: Implementación universal en todas las tablas mediante exportUtils.ts."
    )

    # -------------------------------------------------------------
    # SECCIÓN 5: CLIENTE MÓVIL
    # -------------------------------------------------------------
    add_heading_1("5. Cliente Móvil: AgroPacayales Mobile (React Native + Expo SDK 58)")
    doc.add_paragraph(
        "La aplicación móvil (ASE251S4_T05-mobile) fue diseñada para operarios, agrónomos y supervisores de campo. "
        "Cubre el Flujo Diario del Operario (1 clic), registro fitosanitario de Fichas de Campo en tiempo real, catálogos y analítica.\n\n"
        "1. ¿Dónde está el archivo de configuración?\n"
        "   • Ruta exacta: e:\\Nueva carpeta (8)\\tcc\\ASE251S4_T05-mobile\\.env\n\n"
        "2. ¿Qué poner exactamente en .env? (Escenario Recomendado AWS K3s):\n"
        "   EXPO_PUBLIC_API_URL=http://13.218.34.30:30001/api\n"
        "   EXPO_PUBLIC_ANALYTICS_URL=http://13.218.34.30:30002/api/v1/analytics\n"
        "   (Nota: 13.218.34.30 es la IP pública de AWS. Puerto 30001 es el NodePort a Spring Boot WebFlux y 30002 a Flask Analítico. "
        "En celulares físicos NUNCA usar 'localhost'; la IP pública funciona vía Wi-Fi o datos 4G/5G).\n\n"
        "3. Regla Crítica de Memoria Caché de Expo:\n"
        "   Si modificas el .env mientras Expo está corriendo, Expo NO recarga las variables automáticamente. "
        "Debes presionar Ctrl + C y reiniciar con: npx expo start -c\n\n"
        "4. Modos de Ejecución y Visualización:\n"
        "   • Modo 1 (Recomendado para Sustentación): Presiona 'w' en la terminal de Expo para abrir en Chrome en http://localhost:8081. "
        "La app se enmarca en un simulador de smartphone de lujo centrado (520px, fondo Deep Earth Brown, bisel y controles táctiles).\n"
        "   • Modo 2 (Celular Físico): Abre Expo Go en Android o iOS y escanea el código QR de la terminal (pantalla táctil 100% nativa).\n"
        "   • Modo 3 (Emulador): Presiona 'a' para abrir en Android Studio.\n\n"
        "5. Flujo Operativo y Fichas de Campo:\n"
        "   • Control táctil de 1 clic: [Pendiente] -> [En Proceso] -> [Completado] (descuenta insumos automáticamente en MongoDB y SQL Server).\n"
        "   • Botón directo '+ Nueva Ficha de Campo' en la pantalla principal respetando todas las validaciones técnicas de negocio."
    )

    # -------------------------------------------------------------
    # SECCIÓN 6: VERIFICACIÓN PARA LA SUSTENTACIÓN
    # -------------------------------------------------------------
    add_heading_1("6. Guía de Demostración para la Sustentación")
    doc.add_paragraph(
        "Al momento de sustentar ante el docente, abre estas URLs y demuestra cada funcionalidad:\n"
        "1. Frontend Web: http://<IP_FRONTEND>:30000\n"
        "   • Login corporativo y diseño sin etiquetas de estudiantes.\n"
        "   • Inicio con métricas climáticas e infraestructura en tiempo real.\n"
        "   • Insumos (/insumos): Clic en el 'ojito' azul para ver la ficha técnica, botón Exportar Excel y PDF.\n"
        "   • Parcelas (/parcelas): Clic en el 'ojito' azul para ver el suelo y riego embebidos de MongoDB.\n"
        "   • Usuarios (/usuarios): Clic en el 'ojito' azul para ver los roles y permisos institucionales.\n"
        "   • Labores de Campo (/actividades): Clic en el 'ojito' para ver insumos consumidos en SQL Server.\n"
        "   • Centro de Inteligencia Analítica (/dashboard): Gráficos y 18 indicadores PIT.\n"
        "2. App Móvil: Expo Go (código QR) o http://localhost:8081 en modo web.\n"
        "3. Backend 1 Swagger UI: http://<IP_BACKEND1>:30001/webjars/swagger-ui/index.html\n"
        "4. Backend 2 OpenAPI Docs: http://<IP_ANALITICO>:30002/api/v1/analytics/docs/\n"
        "5. Prueba de Resiliencia (Self-Healing de Kubernetes):\n"
        "   kubectl delete pod -l app=frontend -n agropacayales-namespace\n"
        "   kubectl get pods -n agropacayales-namespace -w  # Se regenera en 3 segundos."
    )

    doc.save(filename)
    print(f"Documento DOCX generado exitosamente: {filename}")

if __name__ == '__main__':
    output_docx = r'e:\Nueva carpeta (8)\tcc\MANUAL_DESPLIEGUE_K3S_AWS.docx'
    create_manual_docx(output_docx)
