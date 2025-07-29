
```markdown
# 🌊 SeaTalk - Real-Time Chat & Media App

SeaTalk is a real-time messaging application built with **Node.js**, **Express**, **MySQL**, **Socket.IO**, and **AWS S3**. It features **direct and group messaging**, **media upload support**, **chat archiving**, and user authentication with JWT.

Live Project: [http://65.1.130.180:3000/signup](http://65.1.130.180:3000/signup)  
GitHub Repo: [https://github.com/sagarbj3245/SeaTalk](https://github.com/sagarbj3245/SeaTalk)

---

## 🚀 Features

- 👥 User authentication with JWT
- 💬 Real-time group and direct messaging using **Socket.IO**
- 📁 Media upload to **AWS S3**
- 🧠 Chat archiving with **node-cron**
- 🔐 Role-based access and session handling
- 📱 Responsive UI with HTML, CSS, and JS

---

## 🛠️ Tech Stack

### Backend
- **Node.js**, **Express.js**
- **MySQL** with native driver
- **JWT** for secure authentication
- **Socket.IO** for real-time communication
- **Multer + AWS S3** for file uploads

### Other Libraries
- **bcrypt** – Password hashing
- **dotenv** – Secure environment variables
- **node-cron** – Scheduled jobs (chat archiving)

---

## 📁 Folder Structure

```

.
├── app.js                   # Main server logic
├── .env                    # Secrets and keys
├── controllers/            # All business logic
│   ├── authController.js
│   ├── chatController.js
│   ├── directController.js
│   ├── groupController.js
│   └── uploadController.js
├── cron/
│   └── archiveChats.js     # Archives chats at intervals
├── middleware/
│   └── authMiddleware.js   # Token verification
├── models/
│   └── index.js            # MySQL DB connection
├── public/                 # Frontend JS
│   ├── chat.js
│   ├── group.js
│   ├── login.js
│   └── signup.js
├── routes/                 # All Express routes
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── groupRoutes.js
│   ├── directRoutes.js
│   └── uploadRoutes.js
├── views/                  # Frontend HTML pages
│   ├── login.html
│   ├── signup.html
│   ├── chat.html
│   └── group.html
└── package.json

````

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
PORT=3002

JWT_SECRET=your_jwt_secret_here

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=seatalk-media-2025
````

---

## 📦 Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/sagarbj3245/SeaTalk.git
cd SeaTalk

# 2. Install dependencies
npm install

# 3. Run the app
node app.js
```

Access the app at: [http://localhost:3002](http://localhost:3002)

---

## 💡 How It Works

### 🔐 Auth & User Flow

* Users sign up and login
* JWT is issued and verified via middleware
* Auth-protected chat routes ensure only logged-in users access chat

### 💬 Real-Time Chat

* Users connect to the Socket.IO server
* Join their room via `socket.join(userId)`
* Broadcast messages to group/direct chat receivers

### 📁 File Upload

* Users can upload images/files in chat
* Files are stored in **AWS S3 bucket** using `multer-s3`

### ⏱️ Chat Archiving

* Scheduled cron job (via `node-cron`) to move old chats to archive or log

---

## ✅ Dependencies

```json
"dependencies": {
  "aws-sdk": "^2.1692.0",
  "bcrypt": "^5.1.0",
  "body-parser": "^1.20.2",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.1",
  "multer": "^2.0.2",
  "multer-s3": "^3.0.1",
  "mysql2": "^3.14.2",
  "node-cron": "^4.2.1",
  "socket.io": "^4.7.4"
}
```

---

## 📬 Contact

**Sagar B J**
📧 Email: [sagarbj001@gmail.com](mailto:sagarbj001@gmail.com)
🔗 GitHub: [https://github.com/sagarbj3245](https://github.com/sagarbj3245)

---

> ✅ Built to demonstrate full-stack real-time communication with media handling and AWS integration.

