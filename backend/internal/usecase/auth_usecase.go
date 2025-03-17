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
	userRepo            repository.UserRepository
	studentProfileRepo  repository.StudentProfileRepository
	employerProfileRepo repository.EmployerProfileRepository
	cfg                 *config.Config
}

func NewAuthUsecase(
	userRepo repository.UserRepository,
	studentRepo repository.StudentProfileRepository,
	employerRepo repository.EmployerProfileRepository,
	cfg *config.Config,
) *AuthUsecase {
	return &AuthUsecase{
		userRepo:            userRepo,
		studentProfileRepo:  studentRepo,
		employerProfileRepo: employerRepo,
		cfg:                 cfg,
	}
}

func (a *AuthUsecase) RegisterStudent(user *model.User, profile *model.StudentProfile) error {
	if user.UserType != model.UserTypeStudent {
		return errors.New("invalid user type for student registration")
	}
	existingUser, err := a.userRepo.GetUserByEmail(user.Email)
	if err == nil && existingUser.ID != 0 {
		return ErrAccountExists
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashed)

	if err := a.userRepo.CreateUser(user); err != nil {
		return err
	}

	profile.UserID = user.ID
	return a.studentProfileRepo.CreateStudentProfile(profile)

}

func (a *AuthUsecase) RegisterEmployer(user *model.User, profile *model.EmployerProfile) error {
	if user.UserType != model.UserTypeEmployer {
		return errors.New("invalid user type for employer registration")
	}
	existingUser, err := a.userRepo.GetUserByEmail(user.Email)
	if err == nil && existingUser.ID != 0 {
		return ErrAccountExists
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashed)

	if err := a.userRepo.CreateUser(user); err != nil {
		return err
	}
	profile.UserID = user.ID
	return a.employerProfileRepo.CreateEmployerProfile(profile)
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
