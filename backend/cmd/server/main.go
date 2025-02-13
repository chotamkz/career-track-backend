package main

import (
	"database/sql"
	"github.com/chotamkz/career-track-backend/internal/config"
	"github.com/chotamkz/career-track-backend/internal/db"
	"github.com/chotamkz/career-track-backend/internal/util"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"log"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Не удалось загрузить .env файл")
	}
	cfg := config.LoadConfig()

	logger := util.NewLogger(cfg.LogLevel)

	dbConn, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("Не удалось подключиться к базе данных: %v", err)
	}
	defer dbConn.Close()

	if err = dbConn.Ping(); err != nil {
		logger.Fatalf("Не удалось подключиться к базе данных: %v", err)
	}
	logger.Info("Успешное подключение к базе данных")

	migrationFile := "migrations/0001_create_tables.sql"
	if err := db.Migrate(dbConn, migrationFile); err != nil {
		logger.Fatalf("Ошибка миграции базы данных: %v", err)
	}
	logger.Info("Миграция базы данных успешно завершена")

	logger.Info("Сервер готов к запуску")
}
