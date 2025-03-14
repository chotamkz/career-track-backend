package usecase

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"github.com/chotamkz/career-track-backend/internal/util"
)

type StudentProfileUsecase struct {
	repo repository.StudentProfileRepository
}

func NewStudentProfileUsecase(repo repository.StudentProfileRepository, logger *util.Logger) *StudentProfileUsecase {
	return &StudentProfileUsecase{repo: repo}
}

func (spu *StudentProfileUsecase) GetProfile(userID uint) (model.StudentProfile, error) {
	return spu.repo.GetStudentProfile(userID)
}

func (spu *StudentProfileUsecase) UpdateProfile(profile *model.StudentProfile) error {
	return spu.repo.UpdateStudentProfile(profile)
}

func (spu *StudentProfileUsecase) CreateProfile(profile *model.StudentProfile) error {
	return spu.repo.CreateStudentProfile(profile)
}
