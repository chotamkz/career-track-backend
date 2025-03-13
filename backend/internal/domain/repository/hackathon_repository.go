package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type HackathonRepository interface {
	CreateHackathon(h *model.Hackathon) error
	GetHackathons() ([]model.Hackathon, error)
	GetHackathonByID(id uint) (model.Hackathon, error)
}
