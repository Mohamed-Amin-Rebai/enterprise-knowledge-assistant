from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    ai_api_key: str
    ai_model: str
    
    langsmith_api_key: str = ""
    langsmith_project: str = "enterprise-rag"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
