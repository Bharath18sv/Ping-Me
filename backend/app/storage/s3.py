import boto3

from app.core.config import settings

s3_client = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)

async def generate_upload_url(
    key:str,
    content_type:str,
    max_file_size:int,
    expires_in:int = 300
    ):
        return s3_client.generate_presigned_post(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Fields={
                "Content-Type":content_type
            },
            Conditions=[
                # S3 itself now rejects an upload exceeding our limit.
                ["content-length-range", 1, max_file_size],
                {"Content-Type":content_type}
            ],
            ExpiresIn=expires_in
            
        )