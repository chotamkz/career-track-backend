package usecase

import (
	"database/sql"
	"errors"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"github.com/chotamkz/career-track-backend/internal/util"
	"time"
)

var (
	ErrAlreadyApplied  = errors.New("you have already applied to this vacancy")
	ErrNotVacancyOwner = errors.New("you do not own this vacancy")
)

type ApplicationUsecase struct {
	appRepo      repository.ApplicationRepository
	vacancyRepo  repository.VacancyRepository
	profileRepo  repository.StudentProfileRepository
	employerRepo repository.EmployerProfileRepository
	userRepo     repository.UserRepository
	logger       *util.Logger
}

func NewApplicationUsecase(appRepo repository.ApplicationRepository, profileRepo repository.StudentProfileRepository, employerRepo repository.EmployerProfileRepository, userRepo repository.UserRepository, vacRepo repository.VacancyRepository, logger *util.Logger) *ApplicationUsecase {
	return &ApplicationUsecase{
		appRepo:      appRepo,
		vacancyRepo:  vacRepo,
		profileRepo:  profileRepo,
		employerRepo: employerRepo,
		userRepo:     userRepo,
		logger:       logger,
	}
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

func (au *ApplicationUsecase) GetStudentApplications(studentID uint) ([]model.ApplicationForStudent, error) {
	apps, err := au.appRepo.GetApplicationsWithVacanciesAndEmployers(studentID)
	if err != nil {
		return nil, err
	}
	return apps, nil
}

func (au *ApplicationUsecase) GetApplicationsWithStudentProfiles(employerID, vacancyID uint) ([]model.ApplicationWithStudent, error) {
	vac, err := au.vacancyRepo.GetVacancyById(vacancyID)
	if err != nil {
		return nil, err
	}
	if vac.EmployerID != employerID {
		return nil, ErrNotVacancyOwner
	}

	apps, err := au.appRepo.GetApplicationsByVacancyID(vacancyID)
	if err != nil {
		return nil, err
	}

	var result []model.ApplicationWithStudent
	for _, app := range apps {
		profile, err := au.profileRepo.GetStudentProfile(app.StudentID)
		if err != nil {
			au.logger.Errorf("cannot load student profile %d: %v", app.StudentID, err)
			continue
		}
		user, err := au.userRepo.GetByID(app.StudentID)
		if err != nil {
			au.logger.Errorf("cannot load user %d: %v", app.StudentID, err)
			continue
		}

		item := model.ApplicationWithStudent{
			Application:  app,
			StudentName:  profile.Name,
			Education:    profile.Education,
			City:         profile.City,
			Phone:        profile.Phone,
			StudentEmail: user.Email,
		}
		result = append(result, item)
	}
	return result, nil
}

func (au *ApplicationUsecase) GetApplicationByID(appID uint) (model.Application, error) {
	return au.appRepo.GetApplicationByID(appID)
}

func (au *ApplicationUsecase) GetApplicationsForVacancy(
	employerID, vacancyID uint,
) ([]model.Application, error) {
	vac, err := au.vacancyRepo.GetVacancyById(vacancyID)
	if err != nil {
		return nil, err
	}
	if vac.EmployerID != employerID {
		return nil, ErrNotVacancyOwner
	}
	return au.appRepo.GetApplicationsByVacancyID(vacancyID)
}
