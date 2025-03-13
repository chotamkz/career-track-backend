package http

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type VacancyHandler struct {
	vacancyUsecase *usecase.VacancyUsecase
	logger         *util.Logger
}

func NewVacancyHandler(vacUsecase *usecase.VacancyUsecase, logger *util.Logger) *VacancyHandler {
	return &VacancyHandler{
		vacancyUsecase: vacUsecase,
		logger:         logger,
	}
}

func (vh *VacancyHandler) ListVacanciesHandler(c *gin.Context) {
	vacancies, err := vh.vacancyUsecase.ListVacancies()
	if err != nil {
		vh.logger.Errorf("Failed to list vacancies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, vacancies)
}

func (vh *VacancyHandler) DetailVacancyHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		vh.logger.Errorf("Invalid vacancy ID: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy ID"})
		return
	}
	vacancy, err := vh.vacancyUsecase.GetVacancyById(uint(id))
	if err != nil {
		vh.logger.Errorf("Failed to get vacancy by ID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, vacancy)
}

func (vh *VacancyHandler) FilterVacanciesHandler(c *gin.Context) {
	filter := model.VacancyFilter{
		Keywords:   c.Query("keywords"),
		Region:     c.Query("region"),
		Experience: c.Query("experience"),
		Schedule:   c.Query("schedule"),
	}
	if salaryStr := c.Query("salary_from"); salaryStr != "" {
		salary, err := strconv.ParseFloat(salaryStr, 64)
		if err != nil {
			vh.logger.Errorf("Invalid salary_from: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid salary_from"})
			return
		}
		filter.SalaryFrom = salary
	}

	vacancies, err := vh.vacancyUsecase.FilterVacancies(filter)
	if err != nil {
		vh.logger.Errorf("Failed to filter vacancies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, vacancies)
}

func (vh *VacancyHandler) CreateVacancyHandler(c *gin.Context) {
	var vacancy model.Vacancy
	if err := c.ShouldBindJSON(&vacancy); err != nil {
		vh.logger.Errorf("Invalid vacancy input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	vacancy.PostedDate = time.Now()
	vacancy.CreatedAt = time.Now()

	if err := vh.vacancyUsecase.CreateVacancy(&vacancy); err != nil {
		vh.logger.Errorf("Failed to create vacancy: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vacancy"})
		return
	}

	c.JSON(http.StatusCreated, vacancy)
}
