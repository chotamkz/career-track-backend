package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type EmployerRepository interface {
	GetAllCompanyNames() ([]string, error)
	GetEmployersByIDs(employerIDs []uint) ([]model.EmployerProfile, error)
}
