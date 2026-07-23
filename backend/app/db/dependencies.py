from app.db.database import SessionLocal

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

# helper to create tables in the database
# def create_tables():
#     Base.metadata.create_all(bind=engine)
