from pydantic import BaseModel, Field

class UploadRequest(BaseModel):
    file_name:str
    content_type:str
    file_size:int = Field(gt=0)

class PresignedUpload(BaseModel):
    url: str
    fields: dict[str, str]

class UploadResponse(BaseModel):
    upload_url: PresignedUpload