package config

import (
	"log"
	"os"
)

type Config struct {
	DatabaseURL   string
	ServerAddress string
	LogLevel      string
}

func LoadConfig() *Config {
	databaseURL := getEnv("DATABASE_URL", "")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}
	serverAddress := getEnv("SERVER_ADDRESS", ":8080")
	logLevel := getEnv("LOG_LEVEL", "INFO")

	return &Config{
		DatabaseURL:   databaseURL,
		ServerAddress: serverAddress,
		LogLevel:      logLevel,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
