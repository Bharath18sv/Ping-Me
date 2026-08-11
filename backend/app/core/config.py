import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    REDIS_URL: str = "redis://localhost:6379/0"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = ""

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            # Strip Railway double-escaping (e.g. [\"http://...\"])
            cleaned_v = v.replace('\\"', '"').replace("\\'", "'")
            if cleaned_v.startswith("[") and cleaned_v.endswith("]"):
                try:
                    v = json.loads(cleaned_v)
                except Exception:
                    v = [item.strip(" \"'\\") for item in cleaned_v[1:-1].split(",") if item.strip()]
            else:
                v = [item.strip(" \"'\\") for item in v.split(",") if item.strip()]
        if isinstance(v, list):
            return [origin.strip(" \"'\\").rstrip("/") for origin in v if isinstance(origin, str) and origin.strip()]
        return v


settings = Settings()