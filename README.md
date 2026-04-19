# CareNest

CareNest la ung dung cham soc suc khoe gia dinh gom:
- `frontend/CareNestApp`: mobile app React Native
- `backend`: Spring Boot API
- `ai`: FastAPI service cho chatbot, OCR va voice backend

Mobile app hien duoc cau hinh de goi backend/AI tren cloud qua:
- `https://webdev.eiyuumiru.it.eu.org`

## Trang thai hien tai

- FE da noi API that cho cac luong chinh thay vi dung mock runtime
- OCR ho tro chup anh truc tiep tu camera hoac chon anh tu thu vien
- Dashboard ho tro scope theo tung profile hoac `Ca nha`
- Family flow co:
  - invite qua email
  - join bang code
- AI chat khong con mac dinh bypass sang context-only; cau hoi du lieu se di theo nhanh truy van du lieu
- Voice backend co endpoint rieng, nhung mobile voice capture UI dang duoc khoa lai cho den khi hoan tat native audio end-to-end

## Cau truc thu muc

```text
CareNest/
|- frontend/
|  \- CareNestApp/
|- backend/
|- ai/
|- deploy/
|- docker-compose.yml
|- docker-compose.prod.yml
\- .env.prod.example
```

## Environment

Repo khong con track secret that.

- Production/deploy: dung `.env.prod.example` lam mau tham chieu
- Local backend/ai: tu tao file `.env` untracked hoac export env vars trong shell/CI

Bien quan trong:

- Backend:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `JWT_SECRET`
  - `AI_SERVICE_BASE_URL`
  - `AI_INTERNAL_TOKEN`
- AI:
  - `DATABASE_URL`
  - `PROXY_API_KEY`
  - `PROXY_BASE_URL`
  - `INTERNAL_SHARED_TOKEN`

## Chay frontend

```bash
cd frontend/CareNestApp
npm install
npm start
```

Luu y:
- frontend hien goi cloud backend theo `src/api/config.ts`
- neu can doi endpoint, sua file config do hoac bo sung co che env rieng cho mobile

## Chay backend local

```bash
cd backend
./mvnw spring-boot:run
```

Yeu cau:
- Java 21
- PostgreSQL
- env vars backend hop le

## Chay AI local

```bash
cd ai
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Yeu cau:
- Python 3.13
- ffmpeg neu muon dung day du voice/audio convert
- env vars AI hop le

## Docker

Local compose:

```bash
docker compose up --build
```

Production compose:

```bash
docker compose --env-file .env.prod up --build -d
```

Trong repo chi co `.env.prod.example`. File `.env.prod` that phai tu tao ben ngoai repo.

## Test va kiem tra

Backend:

```bash
cd backend
./mvnw test
```

Ghi chu:
- backend test dung profile `test`
- datasource test duoc cau hinh theo Testcontainers
- neu may khong co Docker, test context se duoc skip thay vi dung DB that

Frontend:

```bash
cd frontend/CareNestApp
npx tsc --noEmit
npm test -- --runInBand
npm run lint
```

AI:

```bash
cd ai
.\.venv\Scripts\python.exe -m compileall .
```

Indexing:

- `backend/scripts/ai_text2sql_indexes.sql` la script thu cong de them secondary index cho workload text-to-SQL/backend.
- Script nay khong duoc app tu dong chay va khong duoc gan vao CI/CD.
- Chỉ nen review tren moi truong non-prod hoac snapshot truoc khi tu chay thu cong len Neon.

## Luu y khi phat trien

- Khong commit secret, token, password hoac `.env` that
- Neu them API moi o backend, cap nhat luon layer `frontend/CareNestApp/src/api/*`
- Neu them field enum nhu `bloodType`, uu tien normalize o FE thay vi hien thi raw enum tu backend
- Cac man co hanh vi "bam duoc" nen hoac co onPress that, hoac hien ro trang thai chua ho tro

## Tinh nang chinh

- Auth: dang ky, dang nhap, quen mat khau
- Family: tao family, moi qua email, join bang code
- Medicine: tu thuoc, lich uong, OCR toa thuoc
- Appointment: lich hen kham
- Vaccination: theo doi mui tiem
- Growth: theo doi tang truong
- AI: chat, OCR, voice backend
