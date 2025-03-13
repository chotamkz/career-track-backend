package usecase

import (
	"errors"
	"github.com/chotamkz/career-track-backend/internal/config"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

var ErrAccountExists = errors.New("account already exists")
var ErrInvalidCredentials = errors.New("invalid credentials")

type AuthUsecase struct {
	userRepo repository.UserRepository
	cfg      *config.Config
}

func NewAuthUsecase(userRepo repository.UserRepository, cfg *config.Config) *AuthUsecase {
	return &AuthUsecase{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (a *AuthUsecase) RegisterStudent(user *model.User) error {
	existingUser, err := a.userRepo.GetUserByEmail(user.Email)
	if err == nil && existingUser.ID != 0 {
		return ErrAccountExists
	}

	user.UserType = model.UserTypeStudent

	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashed)

	return a.userRepo.CreateUser(user)
}

func (a *AuthUsecase) RegisterEmployer(user *model.User) error {
	existingUser, err := a.userRepo.GetUserByEmail(user.Email)
	if err == nil && existingUser.ID != 0 {
		return ErrAccountExists
	}

	user.UserType = model.UserTypeEmployer

	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashed)

	return a.userRepo.CreateUser(user)
}

func (a *AuthUsecase) LoginUser(email, password string) (string, error) {
	user, err := a.userRepo.GetUserByEmail(email)
	if err != nil {
		return "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"userType": user.UserType,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(a.cfg.JWTSecret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}
