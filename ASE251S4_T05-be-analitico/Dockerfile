FROM python:3.12-slim

# Evitar generación de archivos .pyc y habilitar salida de logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Instalar dependencias del sistema mínimas requeridas
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY app/ ./app/
COPY wsgi.py .
COPY .env.example .

# Crear usuario no root por seguridad
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Ejecutar con Gunicorn (4 workers)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "wsgi:app"]
