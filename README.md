# carenest-webdev2026
CareNest is a smart family health management mobile application that helps users track medical records, medication schedules, doctor appointments, and child development. The system integrates AI chatbot, OCR prescription scanning, and voice assistant to support convenient and personalized healthcare monitoring.

## Run locally

### 1. Start database + backend + AI

```bash
docker compose up --build
```

Services:

- Backend: `http://localhost:8080`
- AI service: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

### 2. Start React Native frontend

```bash
cd frontend/CareNestApp
npm install
npm start
```

For Android emulator, the frontend uses `http://10.0.2.2:8080/api/v1`.
For iOS simulator and local desktop testing, the frontend uses `http://localhost:8080/api/v1`.
