app/
│
├── auth/
│   ├── router.py
│   ├── service.py
│   ├── repository.py
│   ├── schemas.py
│   └── dependencies.py
│
├── users/
│   ├── router.py
│   ├── service.py
│   ├── repository.py
│   └── schemas.py
│
├── conversations/
│   ├── router.py
│   ├── service.py
│   ├── repository.py
│   └── schemas.py
│
├── messages/
│   ├── router.py
│   ├── service.py
│   ├── repository.py
│   └── schemas.py
│
├── sockets/
│   ├── server.py
│   ├── manager.py
│   ├── events.py
│   └── namespaces.py      ← we'll use this later
│
├── redis/
│   ├── client.py
│   ├── presence.py
│   └── pubsub.py
│
├── db/
│   ├── database.py
│   ├── session.py
│   └── models/
│       ├── __init__.py
│       ├── user.py
│       ├── conversation.py
│       ├── participant.py
│       └── message.py
│
├── core/
│   ├── config.py
│   ├── security.py
│   ├── logging.py
│   └── exceptions.py
│
├── utils/
│
└── main.py
