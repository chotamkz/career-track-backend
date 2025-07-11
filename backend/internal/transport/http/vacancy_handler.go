package http

import (
	"database/sql"
	"errors"
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
	vacancyUsecase    *usecase.VacancyUsecase
	logger            *util.Logger
	cfg               *config.Config
	appUsecase        *usecase.ApplicationUsecase
	empProfileUsecase *usecase.EmployerProfileUsecase
}

func NewVacancyHandler(vacUsecase *usecase.VacancyUsecase, appUsecase *usecase.ApplicationUsecase, empProfileUsecase *usecase.EmployerProfileUsecase, logger *util.Logger, cfg *config.Config) *VacancyHandler {
	return &VacancyHandler{
		vacancyUsecase:    vacUsecase,
		appUsecase:        appUsecase,
		empProfileUsecase: empProfileUsecase,
		logger:            logger,
		cfg:               cfg,
	}
}

func (vh *VacancyHandler) ListVacanciesHandler(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	size, err := strconv.Atoi(c.DefaultQuery("size", "5"))
	if err != nil || size < 1 || size > 100 {
		size = 5
	}

	var studentID *uint
	if val, exists := c.Get("user"); exists {
		if id, ok := val.(uint); ok {
			studentID = &id
		}
	}

	vacancies, total, err := vh.vacancyUsecase.ListVacancies(page, size, studentID)
	if err != nil {
		vh.logger.Errorf("ListVacancies failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load vacancies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":       page,
		"size":       size,
		"totalCount": total,
		"vacancies":  vacancies,
	})
}

func (vh *VacancyHandler) DetailVacancyHandler(c *gin.Context) {
	vidParam := c.Param("id")
	vid64, err := strconv.ParseUint(vidParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy id"})
		return
	}
	vacancyID := uint(vid64)

	var studentID *uint
	if ut, exists := c.Get("userType"); exists && ut == string(model.UserTypeStudent) {
		if uidVal, ok := c.Get("user"); ok {
			if sid, ok2 := uidVal.(uint); ok2 {
				studentID = &sid
			}
		}
	}

	resp, err := vh.vacancyUsecase.GetVacancyWithDetails(vacancyID, studentID)
	if err != nil {
		vh.logger.Errorf("Failed to get vacancy details %d: %v", vacancyID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load vacancy details"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (vh *VacancyHandler) FilterVacanciesHandler(c *gin.Context) {
	filter := model.VacancyFilter{
		Keywords:    c.Query("keywords"),
		Region:      c.Query("region"),
		Experience:  c.Query("experience"),
		Schedule:    c.Query("schedule"),
		CompanyName: c.Query("company_name"),
	}
	if salaryStr := c.Query("salary_from"); salaryStr != "" {
		s, err := strconv.ParseFloat(salaryStr, 64)
		if err != nil {
			vh.logger.Errorf("Invalid salary_from: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid salary_from"})
			return
		}
		filter.SalaryFrom = s
	}

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	size, err := strconv.Atoi(c.DefaultQuery("size", "5"))
	if err != nil || size < 1 || size > 100 {
		size = 20
	}

	mlSkills := c.Query("ml_skills")
	if mlSkills != "" {
		recs, err := vh.vacancyUsecase.GetRecommendedVacancies(filter, mlSkills)
		if err != nil {
			vh.logger.Errorf("Failed to get recommended vacancies: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"page":      page,
			"size":      size,
			"vacancies": recs,
		})
		return
	}

	vacs, total, err := vh.vacancyUsecase.FilterVacancies(filter, page, size)
	if err != nil {
		vh.logger.Errorf("Failed to filter vacancies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to filter vacancies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":       page,
		"size":       size,
		"totalCount": total,
		"vacancies":  vacs,
	})
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

	var urlNull sql.NullString
	if input.VacancyURL != "" {
		urlNull = sql.NullString{String: input.VacancyURL, Valid: true}
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
	vacancy.VacancyURL = urlNull
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

func (vh *VacancyHandler) DeleteVacancyHandler(c *gin.Context) {
	vid, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy id"})
		return
	}
	vacancyID := uint(vid)

	empVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	employerID := empVal.(uint)

	err = vh.vacancyUsecase.DeleteVacancy(employerID, vacancyID)
	if err != nil {
		switch err {
		case usecase.ErrNotVacancyOwner:
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not own this vacancy"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vacancy"})
			vh.logger.Errorf("DeleteVacancy failed: %v", err)
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (vh *VacancyHandler) GetEmployerVacanciesHandler(c *gin.Context) {
	uidVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	employerID := uidVal.(uint)

	vacs, err := vh.vacancyUsecase.GetEmployerVacancies(employerID)
	if err != nil {
		vh.logger.Errorf("GetEmployerVacancies failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load vacancies"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"vacancies": vacs})
}

func (h *VacancyHandler) UpdateVacancyHandler(c *gin.Context) {
	vid, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy id"})
		return
	}

	empVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	employerID := empVal.(uint)

	var in struct {
		Title          string   `json:"title" binding:"required"`
		Description    string   `json:"description" binding:"required"`
		Requirements   string   `json:"requirements"`
		Location       string   `json:"location" binding:"required"`
		SalaryFrom     float64  `json:"salary_from"`
		SalaryTo       float64  `json:"salary_to"`
		SalaryCurrency string   `json:"salary_currency"`
		SalaryGross    bool     `json:"salary_gross"`
		VacancyURL     string   `json:"vacancy_url"`
		WorkSchedule   string   `json:"work_schedule"`
		Experience     string   `json:"experience"`
		Skills         []string `json:"skills"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		h.logger.Errorf("Invalid input for update vacancy: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	vac := model.Vacancy{
		ID:             uint(vid),
		Title:          in.Title,
		Description:    in.Description,
		Requirements:   in.Requirements,
		Location:       in.Location,
		SalaryFrom:     in.SalaryFrom,
		SalaryTo:       in.SalaryTo,
		SalaryCurrency: in.SalaryCurrency,
		SalaryGross:    in.SalaryGross,
		VacancyURL:     sql.NullString{String: in.VacancyURL, Valid: in.VacancyURL != ""},
		WorkSchedule:   in.WorkSchedule,
		Experience:     in.Experience,
	}

	if err := h.vacancyUsecase.UpdateVacancy(employerID, &vac, in.Skills); err != nil {
		if errors.Is(err, usecase.ErrNotVacancyOwner) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not own this vacancy"})
		} else if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Vacancy not found"})
		} else {
			h.logger.Errorf("UpdateVacancy failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vacancy"})
		}
		return
	}

	c.JSON(http.StatusOK, vac)
}

func (vh *VacancyHandler) GetRegionsHandler(c *gin.Context) {
	regions, err := vh.vacancyUsecase.GetAllRegions()
	if err != nil {
		vh.logger.Errorf("GetAllRegions failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load regions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"regions": regions})
}
