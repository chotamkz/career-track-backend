package config

import (
	"log"
	"os"
)

type Config struct {
	DatabaseURL string
	LogLevel    string
}

func LoadConfig() *Config {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("Переменная окружения DATABASE_URL не задана")
	}

	return &Config{
		DatabaseURL: databaseURL,
		LogLevel:    getEnv("LOG_LEVEL", "INFO"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
