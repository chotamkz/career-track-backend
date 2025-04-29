package http

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"github.com/gin-gonic/gin"
	"net/http"
)

type StudentProfileHandler struct {
	usecase     *usecase.StudentProfileUsecase
	userUsecase *usecase.UserUsecase
	logger      *util.Logger
}

func NewStudentProfileHandler(usecase *usecase.StudentProfileUsecase, userUsecase *usecase.UserUsecase, logger *util.Logger) *StudentProfileHandler {
	return &StudentProfileHandler{usecase: usecase, userUsecase: userUsecase, logger: logger}
}

func (h *StudentProfileHandler) GetStudentProfile(c *gin.Context) {
	uidVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID := uidVal.(uint)

	user, err := h.userUsecase.GetByID(studentID)
	if err != nil {
		h.logger.Errorf("Failed to load user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load user"})
		return
	}

	profile, err := h.usecase.GetProfile(studentID)
	if err != nil {
		h.logger.Errorf("Failed to get student profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile"})
		return
	}

	resp := struct {
		UserID    uint   `json:"userId"`
		Email     string `json:"email"`
		Name      string `json:"name"`
		Education string `json:"education"`
		City      string `json:"city"`
		Status    bool   `json:"status"`
		Phone     string `json:"phone"`
	}{
		UserID:    profile.UserID,
		Email:     user.Email,
		Name:      profile.Name,
		Education: profile.Education,
		City:      profile.City,
		Status:    profile.Status,
		Phone:     profile.Phone,
	}

	c.JSON(http.StatusOK, resp)
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
	uidVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID := uidVal.(uint)

	var in struct {
		Name      string `json:"name" binding:"required"`
		Education string `json:"education" binding:"required"`
		City      string `json:"city"`
		Status    bool   `json:"status"`
		Phone     string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		h.logger.Errorf("Invalid input for student profile update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	prof := &model.StudentProfile{
		UserID:    studentID,
		Name:      in.Name,
		Education: in.Education,
		City:      in.City,
		Status:    in.Status,
		Phone:     in.Phone,
	}

	if err := h.usecase.UpdateProfile(prof); err != nil {
		h.logger.Errorf("Failed to update student profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}
	c.JSON(http.StatusOK, prof)
}
