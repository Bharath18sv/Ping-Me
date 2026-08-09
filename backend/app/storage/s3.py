import asyncio
from typing import Any

import boto3

from app.core.config import settings


s3_client = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)


async def generate_upload_url(
    key: str,
    content_type: str,
    max_file_size: int,
    expires_in: int = 300,
) -> dict[str, Any]:
    """
    Generate a presigned POST for a direct-to-S3 upload.

    boto3 is synchronous, so the blocking operation is executed
    outside the FastAPI event loop.
    """

    return await asyncio.to_thread(
        s3_client.generate_presigned_post,
        Bucket=settings.AWS_S3_BUCKET,
        Key=key,
        Fields={
            "Content-Type": content_type,
        },
        Conditions=[
            ["content-length-range", 1, max_file_size],
            {"Content-Type": content_type},
        ],
        ExpiresIn=expires_in,
    )


async def head_object(s3_key: str) -> dict[str, Any]:
    """
    Retrieve S3 object metadata using HEAD.

    The boto3 call is synchronous, so execute it in a worker thread
    to avoid blocking the FastAPI event loop.
    """

    return await asyncio.to_thread(
        s3_client.head_object,
        Bucket=settings.AWS_S3_BUCKET,
        Key=s3_key,
    )