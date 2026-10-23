from datetime import datetime, timezone
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field, field_validator

TIPOS_EVENTO = ("CREACION", "ACTUALIZACION", "ELIMINACION", "RESTAURACION", "IMPORTACION", "EXPORTACION", "LOGIN", "TRANSACCION")


class EventoIn(BaseModel):
    """Evento de negocio enviado por el Backend 1 (Spring Boot) al endpoint de ingesta."""
    tipo_evento: Literal[TIPOS_EVENTO]
    entidad: str = Field(min_length=2, max_length=50, description="INSUMO, PARCELA, USUARIO, COSECHA, ACTIVIDAD...")
    entidad_id: Optional[str] = Field(default=None, max_length=50)
    origen: str = Field(default="backend-transaccional", max_length=50)
    usuario: Optional[str] = Field(default=None, max_length=100)
    detalle: Optional[dict[str, Any]] = None
    fecha_evento: Optional[datetime] = None

    @field_validator("entidad")
    @classmethod
    def entidad_mayuscula(cls, v):
        return v.strip().upper()

    def a_documento(self):
        doc = self.model_dump()
        doc["fecha_evento"] = self.fecha_evento or datetime.now(timezone.utc)
        doc["fecha_ingesta"] = datetime.now(timezone.utc)
        return doc


class EventoLoteIn(BaseModel):
    eventos: list[EventoIn] = Field(min_length=1, max_length=500)
