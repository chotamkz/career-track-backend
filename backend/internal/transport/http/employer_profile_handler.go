package http

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"github.com/gin-gonic/gin"
	"net/http"
)

type EmployerProfileHandler struct {
	usecase     *usecase.EmployerProfileUsecase
	userUsecase *usecase.UserUsecase
	logger      *util.Logger
}

func NewEmployerProfileHandler(usecase *usecase.EmployerProfileUsecase, userUsecase *usecase.UserUsecase, logger *util.Logger) *EmployerProfileHandler {
	return &EmployerProfileHandler{usecase: usecase, userUsecase: userUsecase, logger: logger}
}

func (h *EmployerProfileHandler) GetEmployerProfile(c *gin.Context) {
	userIDVal, exists := c.Get("user")
	if !exists {
		h.logger.Error("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	employerID, ok := userIDVal.(uint)
	if !ok {
		h.logger.Error("Invalid user ID type")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}

	profile, err := h.usecase.GetProfile(employerID)
	if err != nil {
		h.logger.Errorf("Failed to get employer profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile"})
		return
	}

	user, err := h.userUsecase.GetByID(employerID)
	if err != nil {
		h.logger.Errorf("Failed to get user email: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile"})
		return
	}

	resp := struct {
		UserID             uint   `json:"userId"`
		Email              string `json:"email"`
		CompanyName        string `json:"companyName"`
		CompanyDescription string `json:"companyDescription"`
		ContactInfo        string `json:"contactInfo"`
	}{
		UserID:             profile.UserID,
		Email:              user.Email,
		CompanyName:        profile.CompanyName,
		CompanyDescription: profile.CompanyDescription,
		ContactInfo:        profile.ContactInfo,
	}

	c.JSON(http.StatusOK, resp)
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
	uidVal, exists := c.Get("user")
	if !exists {
		h.logger.Error("User not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	employerID, ok := uidVal.(uint)
	if !ok {
		h.logger.Error("Invalid user ID in context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}

	var in struct {
		CompanyName        string `json:"companyName" binding:"required"`
		CompanyDescription string `json:"companyDescription"`
		ContactInfo        string `json:"contactInfo"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		h.logger.Errorf("Invalid input for employer profile update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	profile := &model.EmployerProfile{
		UserID:             employerID,
		CompanyName:        in.CompanyName,
		CompanyDescription: in.CompanyDescription,
		ContactInfo:        in.ContactInfo,
	}

	if err := h.usecase.UpdateProfile(profile); err != nil {
		h.logger.Errorf("Failed to update employer profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// 5) отдаем свежий профиль
	c.JSON(http.StatusOK, profile)
}
