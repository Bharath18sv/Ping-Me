import socketio
import threading
import uuid

sio = socketio.Client()

@sio.event
def connect():
    print("✅ Connected")


@sio.event
def disconnect():
    print("❌ Disconnected")

@sio.event
def message_new(data):
    print()
    print("📥 Message received")
    print(data)

@sio.event
def typing(data):
    print()
    print("⌨️ Typing event")
    print(data)

@sio.event
def messages_read(data):
    print()
    print("👀 Messages Read")
    print(data)

@sio.event
def messages_delivered(data):
    print()
    print("📬 Delivered")
    print(data)

ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MmQ0YzdjNC01MjA3LTQ3ODktYjgwNi1jNGZkYmQ2YzdjNTUiLCJleHAiOjE3ODU3Nzg3NzksInR5cGUiOiJhY2Nlc3MifQ.3c8Sc7pd0sFjnDXXW9ANqNz4iRW3hjkvtWv_c-5UlmI"

CONVERSATION_ID = uuid.UUID("532e0879-5c3b-4040-93eb-604c0b31b3d3")

sio.connect(
    "http://localhost:8000",
    auth={
        "token": ACCESS_TOKEN
        }
    )

def sender():

    while True:
        text = input("> ")

        if text == "exit":
            sio.disconnect()
            break

        elif text == "read":
            sio.emit(
                "conversation_read",
                {
                    "conversation_id": str(CONVERSATION_ID),
                },
            )
        elif text == "deliver":
            sio.emit(
                "message_delivered",
                {
                    "conversation_id": str(CONVERSATION_ID),
                    "message_ids": [
                        "9cbf4272-b10e-4f65-95bc-6c7ab1dec0b9"
                    ],
                },
            )

threading.Thread(target=sender, daemon=True).start()

sio.wait()