package usecase

import (
	"database/sql"
	"errors"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"time"
)

var (
	ErrAlreadyApplied = errors.New("you have already applied to this vacancy")
)

type ApplicationUsecase struct {
	appRepo repository.ApplicationRepository
}

func NewApplicationUsecase(appRepo repository.ApplicationRepository) *ApplicationUsecase {
	return &ApplicationUsecase{appRepo: appRepo}
}

func (au *ApplicationUsecase) SubmitApplication(app *model.Application) error {
	prev, err := au.appRepo.GetByStudentAndVacancy(app.StudentID, app.VacancyID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err == nil && prev.Status != model.StatusRejected {
		return ErrAlreadyApplied
	}

	app.Status = model.StatusApplied
	app.SubmittedDate = time.Now()
	app.UpdatedDate = time.Now()
	return au.appRepo.CreateApplication(app)
}

func (au *ApplicationUsecase) ChangeApplicationStatus(appID uint, newStatus model.ApplicationStatus) error {
	return au.appRepo.UpdateApplicationStatus(appID, newStatus)
}

func (au *ApplicationUsecase) GetStudentApplications(studentID uint) ([]model.Application, error) {
	return au.appRepo.GetApplicationsByStudentID(studentID)
}

func (au *ApplicationUsecase) GetApplicationByID(appID uint) (model.Application, error) {
	return au.appRepo.GetApplicationByID(appID)
}

func (au *ApplicationUsecase) GetApplicationByStudentAndVacancy(studentID, vacancyID uint) (model.Application, error) {
	return au.appRepo.GetByStudentAndVacancy(studentID, vacancyID)
}
