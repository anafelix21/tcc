from pydantic import BaseModel, Field


class LimiteQuery(BaseModel):
    limite: int = Field(default=20, ge=0, le=100000, description="Umbral de stock crítico")


class TopQuery(BaseModel):
    top: int = Field(default=10, ge=1, le=100, description="Cantidad máxima de filas")
