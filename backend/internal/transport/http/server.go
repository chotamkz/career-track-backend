package http

import (
	"database/sql"
	"github.com/chotamkz/career-track-backend/internal/config"
	"github.com/chotamkz/career-track-backend/internal/repository/postgres"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"github.com/gin-contrib/cors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func NewServer(cfg *config.Config, db *sql.DB, logger *util.Logger) *http.Server {
	//gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Recovery())

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	vacancyRepo := postgres.NewVacancyRepo(db)
	vacancyUsecase := usecase.NewVacancyUsecase(vacancyRepo)
	vacancyHandler := NewVacancyHandler(vacancyUsecase, logger)

	router.GET("/api/v1/vacancies", vacancyHandler.ListVacanciesHandler)
	router.GET("/api/v1/vacancies/:id", vacancyHandler.DetailVacancyHandler)
	router.GET("/api/v1/vacancies/filter", vacancyHandler.FilterVacanciesHandler)
	router.POST("/api/vacancies", vacancyHandler.CreateVacancyHandler)

	userRepo := postgres.NewUserRepo(db, logger)
	authUsecase := usecase.NewAuthUsecase(userRepo, cfg)
	authHandler := NewAuthHandler(authUsecase, logger)

	router.POST("/api/v1/auth/register/student", authHandler.RegisterStudentHandler)
	router.POST("/api/v1/auth/register/employer", authHandler.RegisterEmployerHandler)
	router.POST("/api/v1/auth/login", authHandler.Login)

	return &http.Server{
		Addr:    cfg.ServerAddress,
		Handler: router,
	}
}
