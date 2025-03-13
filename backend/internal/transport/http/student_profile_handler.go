package http

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type StudentProfileHandler struct {
	usecase *usecase.StudentProfileUsecase
	logger  *util.Logger
}

func NewStudentProfileHandler(usecase *usecase.StudentProfileUsecase, logger *util.Logger) *StudentProfileHandler {
	return &StudentProfileHandler{usecase: usecase, logger: logger}
}

func (h *StudentProfileHandler) GetStudentProfile(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		h.logger.Errorf("Invalid student id: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student id"})
		return
	}
	profile, err := h.usecase.GetProfile(uint(id))
	if err != nil {
		h.logger.Errorf("Failed to get student profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get student profile"})
		return
	}
	c.JSON(http.StatusOK, profile)
}

func (h *StudentProfileHandler) UpdateStudentProfile(c *gin.Context) {
	var profile model.StudentProfile
	if err := c.ShouldBindJSON(&profile); err != nil {
		h.logger.Errorf("Invalid input for student profile update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil || uint(id) != profile.UserID {
		h.logger.Errorf("Student id mismatch")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Student id mismatch"})
		return
	}
	if err := h.usecase.UpdateProfile(&profile); err != nil {
		h.logger.Errorf("Failed to update student profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update student profile"})
		return
	}
	c.JSON(http.StatusOK, profile)
}
