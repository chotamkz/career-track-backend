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
	userIDVal, exists := c.Get("user")
	if !exists {
		h.logger.Error("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID, ok := userIDVal.(uint)
	if !ok {
		h.logger.Error("Invalid user ID type in context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}

	profile, err := h.usecase.GetProfile(studentID)
	if err != nil {
		h.logger.Errorf("Failed to get student profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *StudentProfileHandler) CreateStudentProfileHandler(c *gin.Context) {
	var profile model.StudentProfile
	if err := c.ShouldBindJSON(&profile); err != nil {
		h.logger.Errorf("Invalid input for student profile creation: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	if err := h.usecase.CreateProfile(&profile); err != nil {
		h.logger.Errorf("Failed to create student profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create student profile"})
		return
	}
	c.JSON(http.StatusCreated, profile)
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
	if err != nil {
		h.logger.Errorf("Invalid student id: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student id"})
		return
	}

	profile.UserID = uint(id)

	if err := h.usecase.UpdateProfile(&profile); err != nil {
		h.logger.Errorf("Failed to update student profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update student profile"})
		return
	}
	c.JSON(http.StatusOK, profile)
}
