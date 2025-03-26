package http

import (
	"github.com/chotamkz/career-track-backend/internal/config"
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
	cfg            *config.Config
}

func NewVacancyHandler(vacUsecase *usecase.VacancyUsecase, logger *util.Logger, cfg *config.Config) *VacancyHandler {
	return &VacancyHandler{
		vacancyUsecase: vacUsecase,
		logger:         logger,
		cfg:            cfg,
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
	var input struct {
		Title          string   `json:"title"`
		Description    string   `json:"description"`
		Requirements   string   `json:"requirements"`
		Location       string   `json:"location"`
		SalaryFrom     float64  `json:"salary_from"`
		SalaryTo       float64  `json:"salary_to"`
		SalaryCurrency string   `json:"salary_currency"`
		SalaryGross    bool     `json:"salary_gross"`
		VacancyURL     string   `json:"vacancy_url"`
		WorkSchedule   string   `json:"work_schedule"`
		Experience     string   `json:"experience"`
		Skills         []string `json:"skills"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		vh.logger.Errorf("Invalid vacancy input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var vacancy model.Vacancy
	vacancy.Title = input.Title
	vacancy.Description = input.Description
	vacancy.Requirements = input.Requirements
	vacancy.Location = input.Location
	vacancy.SalaryFrom = input.SalaryFrom
	vacancy.SalaryTo = input.SalaryTo
	vacancy.SalaryCurrency = input.SalaryCurrency
	vacancy.SalaryGross = input.SalaryGross
	vacancy.VacancyURL = input.VacancyURL
	vacancy.WorkSchedule = input.WorkSchedule
	vacancy.Experience = input.Experience
	vacancy.PostedDate = time.Now()
	vacancy.CreatedAt = time.Now()

	employerID, exists := c.Get("user")
	if !exists {
		vh.logger.Errorf("Employer ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	vacancy.EmployerID = employerID.(uint)

	if err := vh.vacancyUsecase.CreateVacancy(&vacancy); err != nil {
		vh.logger.Errorf("Failed to create vacancy: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vacancy"})
		return
	}

	if len(input.Skills) > 0 {
		if err := vh.vacancyUsecase.AddSkillsToVacancy(vacancy.ID, input.Skills); err != nil {
			vh.logger.Errorf("Failed to add skills to vacancy: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Vacancy created, but failed to add skills"})
			return
		}
		vacancy.Skills = input.Skills
	}

	c.JSON(http.StatusCreated, vacancy)
}

func (vh *VacancyHandler) RecommendVacanciesHandler(c *gin.Context) {
	studentSkills := c.Query("student_skills")
	if studentSkills == "" {
		vh.logger.Errorf("Missing parameter: student_skills")
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_skills is required"})
		return
	}

	mlServiceURL := vh.cfg.MLServiceURL
	if mlServiceURL == "" {
		vh.logger.Errorf("ML_SERVICE_URL is not set in config")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ML service URL is not configured"})
		return
	}

	recommendations, err := vh.vacancyUsecase.GetRecommendedVacancies(studentSkills, mlServiceURL)
	if err != nil {
		vh.logger.Errorf("Failed to get recommended vacancies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations"})
		return
	}

	c.JSON(http.StatusOK, recommendations)
}
