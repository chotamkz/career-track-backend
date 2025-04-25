package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type SkillRepository interface {
	GetByName(name string) (model.Skill, error)
	Create(skill *model.Skill) error
}
