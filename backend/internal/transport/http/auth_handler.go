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
	var input struct {
		Email     string `json:"email"`
		Password  string `json:"password"`
		Name      string `json:"name"`
		Education string `json:"education"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		ah.logger.Errorf("Invalid student registration input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	user := model.User{
		Email:    input.Email,
		Password: input.Password,
		UserType: model.UserTypeStudent,
	}
	profile := model.StudentProfile{
		Name:      input.Name,
		Education: input.Education,
	}
	if err := ah.authUsecase.RegisterStudent(&user, &profile); err != nil {
		if err == usecase.ErrAccountExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Account already exists"})
			return
		}
		ah.logger.Errorf("Student registration failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}
	user.Password = ""

	c.JSON(http.StatusCreated, gin.H{"user": user, "profile": profile})
}

func (ah *AuthHandler) RegisterEmployerHandler(c *gin.Context) {
	var input struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		CompanyName string `json:"companyName"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		ah.logger.Errorf("Invalid employer  registration input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	user := model.User{
		Email:    input.Email,
		Password: input.Password,
		UserType: model.UserTypeEmployer,
	}
	profile := model.EmployerProfile{
		CompanyName: input.CompanyName,
	}
	if err := ah.authUsecase.RegisterEmployer(&user, &profile); err != nil {
		if err == usecase.ErrAccountExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Account already exists"})
			return
		}
		ah.logger.Errorf("Employer registration failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusCreated, gin.H{"user": user, "profile": profile})
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
