package http

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type EmployerProfileHandler struct {
	usecase *usecase.EmployerProfileUsecase
	logger  *util.Logger
}

func NewEmployerProfileHandler(usecase *usecase.EmployerProfileUsecase, logger *util.Logger) *EmployerProfileHandler {
	return &EmployerProfileHandler{usecase: usecase, logger: logger}
}

func (h *EmployerProfileHandler) GetEmployerProfile(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		h.logger.Errorf("Invalid employer id: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employer id"})
		return
	}
	profile, err := h.usecase.GetProfile(uint(id))
	if err != nil {
		h.logger.Errorf("Failed to get employer profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get employer profile"})
		return
	}
	c.JSON(http.StatusOK, profile)
}

func (h *EmployerProfileHandler) CreateEmployerProfileHandler(c *gin.Context) {
	var profile model.EmployerProfile
	if err := c.ShouldBindJSON(&profile); err != nil {
		h.logger.Errorf("Invalid input for employer profile creation: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	employerID, exists := c.Get("user")
	if !exists {
		h.logger.Errorf("Employer ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	profile.UserID = employerID.(uint)
	if err := h.usecase.CreateProfile(&profile); err != nil {
		h.logger.Errorf("Failed to create employer profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employer profile"})
		return
	}
	c.JSON(http.StatusCreated, profile)
}

func (h *EmployerProfileHandler) UpdateEmployerProfile(c *gin.Context) {
	var profile model.EmployerProfile
	if err := c.ShouldBindJSON(&profile); err != nil {
		h.logger.Errorf("Invalid input for employer profile update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil || uint(id) != profile.UserID {
		h.logger.Errorf("Employer id mismatch")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Employer id mismatch"})
		return
	}
	if err := h.usecase.UpdateProfile(&profile); err != nil {
		h.logger.Errorf("Failed to update employer profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update employer profile"})
		return
	}
	c.JSON(http.StatusOK, profile)
}
