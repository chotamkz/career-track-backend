package http

import (
	"database/sql"
	"github.com/chotamkz/career-track-backend/internal/config"
	"github.com/chotamkz/career-track-backend/internal/repository/postgres"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"net/http"

	"github.com/gin-gonic/gin"
)

func NewServer(cfg *config.Config, db *sql.DB, logger *util.Logger) *http.Server {
	//gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Recovery())

	vacancyRepo := postgres.NewVacancyRepo(db)
	vacancyUsecase := usecase.NewVacancyUsecase(vacancyRepo)
	vacancyHandler := NewVacancyHandler(vacancyUsecase, logger)

	router.GET("/api/v1/vacancies", vacancyHandler.ListVacanciesHandler)

	return &http.Server{
		Addr:    cfg.ServerAddress,
		Handler: router,
	}
}
