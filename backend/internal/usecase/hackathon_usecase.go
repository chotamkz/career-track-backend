package usecase

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
)

type HackathonUsecase struct {
	hackRepo repository.HackathonRepository
}

func NewHackathonUsecase(hackRepo repository.HackathonRepository) *HackathonUsecase {
	return &HackathonUsecase{hackRepo: hackRepo}
}

func (hu *HackathonUsecase) CreateHackathon(h *model.Hackathon) error {
	return hu.hackRepo.CreateHackathon(h)
}

func (hu *HackathonUsecase) GetHackathons() ([]model.Hackathon, error) {
	return hu.hackRepo.GetHackathons()
}

func (hu *HackathonUsecase) GetHackathonByID(id uint) (model.Hackathon, error) {
	return hu.hackRepo.GetHackathonByID(id)
}
