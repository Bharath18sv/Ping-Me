import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.attachments import Attachment


class AttachmentRepository:

    @staticmethod
    async def create(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        file_name: str,
        content_type: str,
        file_size: int,
        s3_key: str,
    ) -> Attachment:
        attachment = Attachment(
            conversation_id=conversation_id,
            uploaded_by=user_id,
            file_name=file_name,
            content_type=content_type,
            file_size=file_size,
            s3_key=s3_key,
        )

        db.add(attachment)

        try:
            await db.flush()
            await db.commit()

        except IntegrityError:
            await db.rollback()

            existing_attachment = await AttachmentRepository.get_by_s3_key(
                db=db,
                s3_key=s3_key,
            )

            if existing_attachment is not None:
                return existing_attachment

            raise

        await db.refresh(attachment)

        return attachment

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        attachment_id: uuid.UUID,
    ) -> Attachment | None:
        result = await db.execute(
            select(Attachment).where(
                Attachment.id == attachment_id
            )
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_s3_key(
        db: AsyncSession,
        s3_key: str,
    ) -> Attachment | None:
        result = await db.execute(
            select(Attachment).where(
                Attachment.s3_key == s3_key
            )
        )

        return result.scalar_one_or_none()