package http

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"github.com/gin-gonic/gin"
	"net/http"
)

type AuthHandler struct {
	authUsecase *usecase.AuthUsecase
	logger      *util.Logger
}

func NewAuthHandler(authUsecase *usecase.AuthUsecase, logger *util.Logger) *AuthHandler {
	return &AuthHandler{
		authUsecase: authUsecase,
		logger:      logger,
	}
}

func (ah *AuthHandler) RegisterStudentHandler(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		ah.logger.Errorf("Invalid student registration input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	if err := ah.authUsecase.RegisterStudent(&user); err != nil {
		if err == usecase.ErrAccountExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Account already exists"})
			return
		}
		ah.logger.Errorf("Student registration failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}
	responseUser := struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Email    string `json:"email"`
		UserType string `json:"userType"`
	}{
		ID:       user.ID,
		Name:     user.Name,
		Email:    user.Email,
		UserType: string(user.UserType),
	}
	//user.Password = ""

	c.JSON(http.StatusCreated, responseUser)
}

func (ah *AuthHandler) RegisterEmployerHandler(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		ah.logger.Errorf("Invalid employer  registration input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	if err := ah.authUsecase.RegisterEmployer(&user); err != nil {
		if err == usecase.ErrAccountExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Account already exists"})
			return
		}
		ah.logger.Errorf("Employer registration failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}
	responseUser := struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Email    string `json:"email"`
		UserType string `json:"userType"`
	}{
		ID:       user.ID,
		Name:     user.Name,
		Email:    user.Email,
		UserType: string(user.UserType),
	}
	//user.Password = ""

	c.JSON(http.StatusCreated, responseUser)
}

func (ah *AuthHandler) Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		ah.logger.Errorf("Invalid login input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	token, err := ah.authUsecase.LoginUser(input.Email, input.Password)
	if err != nil {
		ah.logger.Errorf("Login failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token})
}
