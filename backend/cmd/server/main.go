package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/config"
	"github.com/chotamkz/career-track-backend/internal/db"
	httpDelivery "github.com/chotamkz/career-track-backend/internal/transport/http"
	"github.com/chotamkz/career-track-backend/internal/util"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

const (
	dbConnMaxLifetime = 5 * time.Minute
	dbMaxOpenConns    = 5
	dbMaxIdleConns    = 5
	dbPingTimeout     = 30 * time.Second

	schedulerPerPage     = 50
	schedulerTotalPages  = 4
	schedulerRefreshRate = 1 * time.Hour

	shutdownTimeout = 30 * time.Second
	migrationPath   = "./migrations/0001_create_tables.sql"
)

func main() {
	logger := util.NewLogger("info")

	if err := godotenv.Load(".env"); err != nil {
		logger.Warn("WARNING: .env file not found; using system environment variables")
	}

	cfg := config.LoadConfig()

	logger = util.NewLogger(cfg.LogLevel)
	logger.Info("Configuration loaded successfully")

	dbConn, err := initializeDB(cfg.DatabaseURL, logger)
	if err != nil {
		logger.Fatalf("Database initialization failed", "error", err)
	}
	defer func() {
		if err := dbConn.Close(); err != nil {
			logger.Errorf("Error closing database connection", "error", err)
		}
	}()

	//--parsing hh vacancies
	/*	userRepo := postgres.NewUserRepo(dbConn, logger)
		vacancyRepo := postgres.NewVacancyRepo(dbConn)
		skillRepo := postgres.NewSkillRepo(dbConn)
		vacancyUse := usecase.NewVacancyUsecase(vacancyRepo, skillRepo, cfg.MLServiceURL)

		vacancyScheduler := scheduler.NewVacancyScheduler(
			dbConn,
			userRepo,
			vacancyRepo,
			vacancyUse,
			logger,
			schedulerPerPage,
			schedulerTotalPages,
			schedulerRefreshRate,
		)
		vacancyScheduler.Start()*/
	//--parsing

	server := httpDelivery.NewServer(cfg, dbConn, logger)
	go startHTTPServer(server, cfg.ServerAddress, logger)

	gracefulShutdown(server, logger)
}

func initializeDB(databaseURL string, logger *util.Logger) (*sql.DB, error) {
	dbConn, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open DB connection: %w", err)
	}

	dbConn.SetConnMaxLifetime(dbConnMaxLifetime)
	dbConn.SetMaxOpenConns(dbMaxOpenConns)
	dbConn.SetMaxIdleConns(dbMaxIdleConns)

	ctx, cancel := context.WithTimeout(context.Background(), dbPingTimeout)
	defer cancel()

	if err := dbConn.PingContext(ctx); err != nil {
		dbConn.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	logger.Info("Successfully connected to the database")

	//--Выполнение миграций
	if err := db.Migrate(dbConn, migrationPath); err != nil {
		dbConn.Close()
		return nil, fmt.Errorf("database migration failed: %w", err)
	}
	logger.Info("Database migration completed successfully")

	return dbConn, nil
}

func startHTTPServer(server *http.Server, address string, logger *util.Logger) {
	logger.Infof("HTTP server is starting", "address", address)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Fatalf("HTTP server error", "error", err)
	}
}

func gracefulShutdown(server *http.Server, logger *util.Logger) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	sig := <-quit

	logger.Infof("Shutdown signal received", "signal", sig.String())

	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Errorf("HTTP server shutdown error", "error", err)
	} else {
		logger.Info("HTTP server shut down gracefully")
	}
}
