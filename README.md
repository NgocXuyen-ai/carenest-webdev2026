# CareNest

CareNest là ứng dụng chăm sóc sức khỏe gia đình gồm:
- `frontend/CareNestApp`: mobile app React Native
- `backend`: Spring Boot API
- `ai`: FastAPI service cho chatbot, OCR va voice backend

Mobile app hiện được cấu hình để gọi backend/AI trên cloud qua:
- `https://webdev.eiyuumiru.it.eu.org`

## Trạng thái hiện tại

- FE đã nối API thật cho các luồng chính thay vì dùng mock runtime
- OCR hỗ trợ chụp ảnh trực tiếp từ camera hoặc chọn ảnh từ thư viện
- Dashboard hỗ trợ scope theo từng profile hoặc `Ca nha`
- Family flow có:
  - invite qua email
  - join bằng code
- AI chat không còn mặc định bypass sang context-only; câu hỏi dữ liệu sẽ đi theo nhánh truy vấn dữ liệu
- Voice backend có endpoint riêng, nhưng mobile voice capture UI đang được khóa lại cho đến khi hoàn tất native audio end-to-end

## Cấu trúc thư mục

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

Repo không còn track secret thật.

- Production/deploy: dung `.env.prod.example` làm mẫu tham chiếu
- Local backend/ai: tự tạo file `.env` untracked hoặc export env vars trong shell/CI

Biến quan trọng:

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

## Chạy frontend

```bash
cd frontend/CareNestApp
npm install
npm start
```

Luu y:
- frontend hiện gọi cloud backend theo `src/api/config.ts`
- nếu cần đổi endpoint, sửa file config đó hoặc bổ sung cơ chế env riêng cho mobile

## Chạy backend local

```bash
cd backend
./mvnw spring-boot:run
```

Yêu cầu:
- Java 21
- PostgreSQL
- env vars backend hợp lệ

## Chay AI local

```bash
cd ai
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Yêu cầu:
- Python 3.13
- ffmpeg nếu muốn dùng đầy đủ voice/audio convert
- env vars AI hợp lệ

## Docker

Local compose:

```bash
docker compose up --build
```

Production compose:

```bash
docker compose --env-file .env.prod up --build -d
```

Trong repo chỉ có `.env.prod.example`. File `.env.prod` thật phải tự tạo từ bên ngoài repo.

## Test và kiểm tra

Backend:

```bash
cd backend
./mvnw test
```

Ghi chú:
- backend test dung profile `test`
- datasource test duoc cau hinh theo Testcontainers
- nếu máy không có Docker, test context sẽ được skip thay vì dùng DB thật

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

- `backend/scripts/ai_text2sql_indexes.sql` la script thủ công để thêm secondary index cho workload text-to-SQL/backend.
- Script này không được app tự động chạy và không được gắn vào CI/CD.
- Chỉ nên review trên môi trường non-prod hoặc snapshot trước khi tự chạy thủ công trên Neon.

## Lưu ý khi phát triển

- Không commit secret, token, password hoac `.env` thật
- Nếu thêm API mới ở backend, cập nhật luôn layer `frontend/CareNestApp/src/api/*`
- Nếu thêm field enum như `bloodType`, ưu tiên normalize ở FE thay vì hiển thị raw enum từ backend
- Cac man co hanh vi "bam duoc" nen hoac co onPress that, hoac hien ro trang thai chua ho tro

## Tính năng chính

- Auth: đăng ký, đăng nhập, quên mật khẩu
- Family: tạo family, mời qua family, join bằng code
- Medicine: tủ thuốc, lịch uống, OCR toa thuốc
- Appointment: lịch hẹn khám
- Vaccination: theo dõi mũi tiêm
- Growth: theo dõi tăng trưởng
- AI: chat, OCR, voice backend
