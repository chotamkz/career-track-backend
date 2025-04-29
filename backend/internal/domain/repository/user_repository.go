package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type UserRepository interface {
	EnsureEmployerExists(employerID uint, companyName string) error
	CreateUser(v *model.User) error
	GetUserByEmail(email string) (model.User, error)
	GetByID(userID uint) (model.User, error)
}
