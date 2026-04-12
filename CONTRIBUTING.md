# 🤝 Contributing to CareNest

Chào mừng bạn đến với dự án **CareNest** 💙
Tài liệu này hướng dẫn cách clone project, setup môi trường và quy trình làm việc với Git.

---

# 🚀 1. Clone project

```bash
git clone https://github.com/NgocXuyen-ai/carenest-webdev2026.git
cd carenest-webdev2026
```

---

# 🛠️ 2. Setup môi trường

## 📌 Yêu cầu

* Java 21
* Node.js (>= 18)
* PostgreSQL
* Python 3.10+

---

# 🗄️ 2.1 Setup PostgreSQL

## Tạo database:

```sql
CREATE DATABASE carenest;
```

---

## Cấu hình backend

Mở file:

```bash
backend/src/main/resources/application.properties
```

Thêm:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/carenest
spring.datasource.username=postgres
spring.datasource.password=123456

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

---

# ⚙️ 2.2 Chạy Backend (Spring Boot)

```bash
cd backend
mvnw.cmd spring-boot:run
```

👉 Backend chạy tại:

```text
http://localhost:8080
```

---

# 🤖 2.3 Chạy AI Service

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

👉 AI chạy tại:

```text
http://localhost:8000
```

---

# 📱 2.4 Chạy Frontend (React Native - Expo)

```bash
cd frontend/app
npm install
npm start
```

👉 Dùng app Expo Go để scan QR

---

# ⚠️ Lưu ý quan trọng

* Điện thoại và máy tính phải cùng WiFi
* KHÔNG dùng `localhost` trên mobile

👉 Ví dụ:

```js
const API_URL = "http://192.168.x.x:8080";
```

---

# 🌿 3. Quy trình Git

## 🔹 1. Luôn pull code mới nhất

```bash
git checkout main
git pull origin main
```

---

## 🔹 2. Tạo branch mới

```bash
git checkout -b feature/ten-chuc-nang
```

Ví dụ:

```bash
git checkout -b feature/auth-login
git checkout -b feature/health-profile
```

---

## 🔹 3. Commit code

```bash
git add .
git commit -m "feat: add login api"
```

---

## 🔹 4. Push branch

```bash
git push origin feature/ten-chuc-nang
```

---

## 🔹 5. Tạo Pull Request

* Vào GitHub
* Tạo Pull Request vào `main`

---

# 📌 Quy ước đặt tên

| Loại     | Ví dụ            |
| -------- | ---------------- |
| Feature  | feature/login    |
| Fix      | fix/api-error    |
| UI       | ui/dashboard     |
| Refactor | refactor/service |

---

# 🧪 4. Trước khi push

* Backend chạy được (port 8080)
* Kết nối PostgreSQL thành công
* Không commit:

  * `node_modules/`
  * `venv/`
  * `.env`

---

# 🚫 Không được làm

* ❌ Push trực tiếp vào `main`
* ❌ Commit code chưa test
* ❌ Hardcode password database

---

# 🎯 Tổng kết

1. Clone project
2. Setup PostgreSQL
3. Chạy backend + frontend + AI
4. Tạo branch riêng
5. Code → commit → push → PR

---

Happy coding 🚀
