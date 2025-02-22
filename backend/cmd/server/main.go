package main

import (
	"context"
	"database/sql"
	"github.com/chotamkz/career-track-backend/internal/config"
	"github.com/chotamkz/career-track-backend/internal/db"
	httpDelivery "github.com/chotamkz/career-track-backend/internal/transport/http"
	"github.com/chotamkz/career-track-backend/internal/util"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("WARNING: .env file not found; using system environment variables")
	}

	cfg := config.LoadConfig()

	logger := util.NewLogger(cfg.LogLevel)
	logger.Info("Configuration loaded successfully")

	dbConn, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("Failed to open DB connection: %v", err)
	}
	defer dbConn.Close()

	dbConn.SetConnMaxLifetime(3 * time.Minute)
	dbConn.SetMaxOpenConns(10)
	dbConn.SetMaxIdleConns(10)

	if err := dbConn.Ping(); err != nil {
		logger.Fatalf("Failed to ping DB: %v", err)
	}
	logger.Info("Successfully connected to the database")

	migrationFile := "migrations/0001_create_tables.sql"
	if err := db.Migrate(dbConn, migrationFile); err != nil {
		logger.Fatalf("Database migration failed: %v", err)
	}
	logger.Info("Database migration completed successfully")

	///import csv
	/*		err = delivery.ImportVacanciesFromCSV("vacancies.csv", dbConn, logger)
			if err != nil {
				log.Fatalf("CSV import failed: %v", err)
			}

			log.Println("CSV import completed successfully.")*/
	////

	server := httpDelivery.NewServer(cfg, dbConn, logger)

	go func() {
		logger.Info("HTTP server is starting on " + cfg.ServerAddress)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("HTTP server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	logger.Info("Shutdown signal received; shutting down HTTP server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		logger.Errorf("HTTP server shutdown error: %v", err)
	}
	logger.Info("HTTP server shut down gracefully")
}
