import socketio

sio = socketio.Client()

@sio.event
def connect():
    print("✅ Connected")

@sio.event
def disconnect():
    print("❌ Disconnected")

ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MmQ0YzdjNC01MjA3LTQ3ODktYjgwNi1jNGZkYmQ2YzdjNTUiLCJleHAiOjE3ODU1MTU2MzEsInR5cGUiOiJhY2Nlc3MifQ.iIdzgw7yeIluH_c0oB91Z949gdzsg7BxKhCnV4cEI0g"

sio.connect(
    "http://localhost:8000",
    auth={
        "token": ACCESS_TOKEN
    }
    )

input("Press enter to disconnect")

sio.disconnect()