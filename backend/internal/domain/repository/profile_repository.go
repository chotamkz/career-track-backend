package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type EmployerProfileRepository interface {
	GetEmployerProfile(userID uint) (model.EmployerProfile, error)
	UpdateEmployerProfile(profile *model.EmployerProfile) error
}

type StudentProfileRepository interface {
	GetStudentProfile(userID uint) (model.StudentProfile, error)
	UpdateStudentProfile(profile *model.StudentProfile) error
}
