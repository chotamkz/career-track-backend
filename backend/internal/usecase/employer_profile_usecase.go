package usecase

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"github.com/chotamkz/career-track-backend/internal/util"
)

type EmployerProfileUsecase struct {
	repo    repository.EmployerProfileRepository
	empRepo repository.EmployerRepository
}

func NewEmployerProfileUsecase(repo repository.EmployerProfileRepository, empRepo repository.EmployerRepository, logger *util.Logger) *EmployerProfileUsecase {
	return &EmployerProfileUsecase{repo: repo, empRepo: empRepo}
}

func (epu *EmployerProfileUsecase) GetProfile(userID uint) (model.EmployerProfile, error) {
	return epu.repo.GetEmployerProfile(userID)
}

func (epu *EmployerProfileUsecase) UpdateProfile(profile *model.EmployerProfile) error {
	return epu.repo.UpdateEmployerProfile(profile)
}

func (epu *EmployerProfileUsecase) CreateProfile(profile *model.EmployerProfile) error {
	return epu.repo.CreateEmployerProfile(profile)
}

func (epu *EmployerProfileUsecase) GetAllCompanyNames() ([]string, error) {
	return epu.empRepo.GetAllCompanyNames()
}
