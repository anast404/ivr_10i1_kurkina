// Импортируется первым в каждом тесте: переменные должны быть заданы до загрузки приложения
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.BASE_URL = "http://localhost:5000";
process.env.MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/happyhome_test";
