package http

import (
	"database/sql"
	"github.com/chotamkz/career-track-backend/internal/config"
	"github.com/chotamkz/career-track-backend/internal/middleware"
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
	vacancyUsecase := usecase.NewVacancyUsecase(vacancyRepo, cfg.MLServiceURL)
	appUsecase := usecase.NewApplicationUsecase(postgres.NewApplicationRepo(db), vacancyRepo)
	vacancyHandler := NewVacancyHandler(vacancyUsecase, appUsecase, logger, cfg)
	router.GET("/api/v1/vacancies", vacancyHandler.ListVacanciesHandler)
	router.GET("/api/v1/vacancies/:id", middleware.OptionalAuth(cfg.JWTSecret), vacancyHandler.DetailVacancyHandler)
	router.GET("/api/v1/vacancies/search", vacancyHandler.FilterVacanciesHandler)
	router.POST("/api/v1/vacancies", middleware.RequireEmployer(cfg.JWTSecret), vacancyHandler.CreateVacancyHandler)
	router.GET("/api/v1/employers/me/vacancies", middleware.RequireEmployer(cfg.JWTSecret), vacancyHandler.GetEmployerVacanciesHandler)
	router.DELETE("/api/v1/vacancies/:id", middleware.RequireEmployer(cfg.JWTSecret), vacancyHandler.DeleteVacancyHandler)

	userRepo := postgres.NewUserRepo(db, logger)
	profileRepo := postgres.NewProfileRepo(db, logger)
	authUsecase := usecase.NewAuthUsecase(userRepo, profileRepo, profileRepo, cfg)
	authHandler := NewAuthHandler(authUsecase, logger)
	router.POST("/api/v1/auth/register/student", authHandler.RegisterStudentHandler)
	router.POST("/api/v1/auth/register/employer", authHandler.RegisterEmployerHandler)
	router.POST("/api/v1/auth/login", authHandler.Login)

	employerProfileUsecase := usecase.NewEmployerProfileUsecase(profileRepo, logger)
	employerProfileHandler := NewEmployerProfileHandler(employerProfileUsecase, logger)
	router.GET("/api/v1/employers/me", middleware.RequireEmployer(cfg.JWTSecret), employerProfileHandler.GetEmployerProfile)
	router.PUT("/api/v1/employers/:id", middleware.RequireEmployer(cfg.JWTSecret), employerProfileHandler.UpdateEmployerProfile)
	router.POST("/api/v1/employers/profile", middleware.RequireEmployer(cfg.JWTSecret), employerProfileHandler.CreateEmployerProfileHandler)

	studentProfileUsecase := usecase.NewStudentProfileUsecase(profileRepo, logger)
	studentProfileHandler := NewStudentProfileHandler(studentProfileUsecase, logger)
	router.GET("/api/v1/students/me", middleware.RequireStudent(cfg.JWTSecret), studentProfileHandler.GetStudentProfile)
	router.PUT("/api/v1/students/:id", studentProfileHandler.UpdateStudentProfile)
	router.POST("/api/v1/students/profile", studentProfileHandler.CreateStudentProfileHandler)

	hackathonRepo := postgres.NewHackathonRepo(db)
	hackathonUsecase := usecase.NewHackathonUsecase(hackathonRepo)
	hackathonHandler := NewHackathonHandler(hackathonUsecase, logger)
	router.POST("/api/v1/hackathons", hackathonHandler.CreateHackathonHandler)
	router.GET("/api/v1/hackathons", hackathonHandler.GetHackathonsHandler)
	router.GET("/api/v1/hackathons/:id", hackathonHandler.DetailHackathonHandler)

	applicationHandler := NewApplicationHandler(appUsecase, logger)
	router.POST("/api/v1/vacancies/:id/apply", middleware.RequireStudent(cfg.JWTSecret), applicationHandler.SubmitApplicationHandler)
	router.PATCH("/api/v1/vacancies/applications/:id", middleware.RequireEmployer(cfg.JWTSecret), applicationHandler.UpdateApplicationStatusHandler)
	router.GET("/api/v1/applications/me", middleware.RequireStudent(cfg.JWTSecret), applicationHandler.GetStudentApplicationsHandler)
	router.GET("/api/v1/vacancies/:id/applications", middleware.RequireEmployer(cfg.JWTSecret), applicationHandler.GetApplicationsForVacancyHandler)

	return &http.Server{
		Addr:    cfg.ServerAddress,
		Handler: router,
	}
}
