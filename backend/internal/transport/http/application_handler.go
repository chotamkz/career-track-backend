package http

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type ApplicationHandler struct {
	appUsecase *usecase.ApplicationUsecase
	logger     *util.Logger
}

func NewApplicationHandler(appUsecase *usecase.ApplicationUsecase, logger *util.Logger) *ApplicationHandler {
	return &ApplicationHandler{appUsecase: appUsecase, logger: logger}
}

func (ah *ApplicationHandler) SubmitApplicationHandler(c *gin.Context) {
	vacancyIDStr := c.Param("id")
	vacancyID, err := strconv.ParseUint(vacancyIDStr, 10, 32)
	if err != nil {
		ah.logger.Errorf("Invalid vacancy id: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy id"})
		return
	}
	studentIDVal, exists := c.Get("user")
	if !exists {
		ah.logger.Errorf("Student id not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID, ok := studentIDVal.(uint)
	if !ok {
		ah.logger.Errorf("Invalid student id type")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}
	var input struct {
		CoverLetter string `json:"coverLetter"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		ah.logger.Errorf("Invalid input for application: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	app := model.Application{
		StudentID:   studentID,
		VacancyID:   uint(vacancyID),
		CoverLetter: input.CoverLetter,
	}
	if err := ah.appUsecase.SubmitApplication(&app); err != nil {
		ah.logger.Errorf("Failed to submit application: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit application"})
		return
	}
	c.JSON(http.StatusCreated, app)
}

func (ah *ApplicationHandler) UpdateApplicationStatusHandler(c *gin.Context) {
	appIDStr := c.Param("id")
	appID, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		ah.logger.Errorf("Invalid application id: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application id"})
		return
	}
	var input struct {
		NewStatus model.ApplicationStatus `json:"newStatus"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		ah.logger.Errorf("Invalid input for updating application status: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	if err := ah.appUsecase.ChangeApplicationStatus(uint(appID), input.NewStatus); err != nil {
		ah.logger.Errorf("Failed to update application status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update application status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Application status updated successfully"})
}

func (ah *ApplicationHandler) GetStudentApplicationsHandler(c *gin.Context) {
	studentIDStr := c.Param("id")
	studentID, err := strconv.ParseUint(studentIDStr, 10, 32)
	if err != nil {
		ah.logger.Errorf("Invalid student id: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student id"})
		return
	}
	apps, err := ah.appUsecase.GetStudentApplications(uint(studentID))
	if err != nil {
		ah.logger.Errorf("Failed to get applications for student: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get applications"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"applications": apps})
}
