from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    ai_api_key: str
    ai_model: str
    clerk_secret_key: str
    clerk_jwt_key: str
    
    langsmith_tracing: bool = False
    langsmith_endpoint: str = ""
    langsmith_api_key: str = ""
    langsmith_project: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
