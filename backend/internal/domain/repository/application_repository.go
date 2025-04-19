package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type ApplicationRepository interface {
	CreateApplication(app *model.Application) error
	UpdateApplicationStatus(appID uint, newStatus model.ApplicationStatus) error
	GetApplicationsByStudentID(studentID uint) ([]model.Application, error)
	GetApplicationByID(appID uint) (model.Application, error)
	GetByStudentAndVacancy(studentID, vacancyID uint) (model.Application, error)
}
