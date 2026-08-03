import socketio
import threading
import uuid
import sys

sio = socketio.Client()

ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MmQ0YzdjNC01MjA3LTQ3ODktYjgwNi1jNGZkYmQ2YzdjNTUiLCJleHAiOjE3ODU3ODM5NzMsInR5cGUiOiJhY2Nlc3MifQ.V2hvh_AYFbW-Y5-qVL4Y6I0409D2Eui9iQYvQuDAwjg"

CONVERSATION_ID = uuid.UUID(
    "532e0879-5c3b-4040-93eb-604c0b31b3d3"
)

PORT = sys.argv[1] if len(sys.argv) > 1 else "8000"


# ==========================
# Socket Events
# ==========================

@sio.event
def connect():
    print(f"✅ Connected to :{PORT}")


@sio.event
def disconnect():
    print("❌ Disconnected")


@sio.event
def message_new(data):
    print("\n📥 message_new")
    print(data)


@sio.event
def typing(data):
    print("\n⌨️ typing")
    print(data)


@sio.event
def messages_read(data):
    print("\n👀 messages_read")
    print(data)


@sio.event
def messages_delivered(data):
    print("\n📬 messages_delivered")
    print(data)


@sio.event
def user_online(data):
    print("\n🟢 user_online")
    print(data)


@sio.event
def user_offline(data):
    print("\n🔴 user_offline")
    print(data)

@sio.event
def message_updated(data):
    print()
    print("✏️ Message Updated")
    print(data)

@sio.event
def message_deleted(data):
    print()
    print("🗑️ Message Deleted")
    print(data)

# ==========================
# Connect
# ==========================

sio.connect(
    f"http://localhost:{PORT}",
    auth={
        "token": ACCESS_TOKEN,
    },
)


# ==========================
# CLI
# ==========================

def sender():
    while True:
        text = input("> ").strip()

        if text == "exit":
            sio.disconnect()
            break

        elif text.startswith("msg "):
            content = text[4:]

            sio.emit(
                "message_send",
                {
                    "conversation_id": str(CONVERSATION_ID),
                    "content": content,
                },
            )

        elif text == "typing":
            sio.emit(
                "typing_start",
                {
                    "conversation_id": str(CONVERSATION_ID),
                },
            )

        elif text == "stop":
            sio.emit(
                "typing_stop",
                {
                    "conversation_id": str(CONVERSATION_ID),
                },
            )

        elif text == "read":
            sio.emit(
                "conversation_read",
                {
                    "conversation_id": str(CONVERSATION_ID),
                },
            )

        elif text.startswith("deliver "):
            message_id = text.split()[1]

            sio.emit(
                "message_delivered",
                {
                    "conversation_id": str(CONVERSATION_ID),
                    "message_ids": [
                        message_id,
                    ],
                },
            )
        elif text.startswith("edit "):
            parts = text.split()
            if len(parts) < 3:
                print("Usage:")
                print("edit <message_id> <new text>")
                continue

            sio.emit(
                "message_edit",
                {
                    "message_id": parts[1],
                    "content": " ".join(parts[2:])
                }
            )

        elif text.startswith("delete "):
            parts = text.split()
            if len(parts) != 2:
                print("Usage:")
                print("delete <message_id>")
                continue

            sio.emit(
                "message_delete",
                {
                    "message_id": parts[1]
                }
            )
        
        elif text == "help":
            print(
                """
Commands

msg <text>                    Send message
typing                        Start typing
stop                          Stop typing
read                          Mark conversation as read
deliver <message_id>          Send delivery receipt
edit <message_id> <new text>   Edit message
delete <message_id>           Delete message
exit                          Disconnect
"""
            )

        else:
            print("Unknown command. Type 'help'.")


threading.Thread(target=sender, daemon=True).start()

print("\nType 'help' to see commands.\n")

sio.wait()