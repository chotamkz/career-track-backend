package usecase

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"time"
)

type ApplicationUsecase struct {
	appRepo repository.ApplicationRepository
}

func NewApplicationUsecase(appRepo repository.ApplicationRepository) *ApplicationUsecase {
	return &ApplicationUsecase{appRepo: appRepo}
}

func (au *ApplicationUsecase) SubmitApplication(app *model.Application) error {
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
