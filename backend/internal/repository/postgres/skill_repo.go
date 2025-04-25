package postgres

import (
	"database/sql"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
)

type SkillRepo struct {
	DB *sql.DB
}

func NewSkillRepo(db *sql.DB) repository.SkillRepository {
	return &SkillRepo{DB: db}
}

func (sr *SkillRepo) GetByName(name string) (model.Skill, error) {
	var s model.Skill
	err := sr.DB.QueryRow(`SELECT id,name,created_at,updated_at FROM skills WHERE name=$1`, name).
		Scan(&s.ID, &s.Name, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return s, err
	}
	return s, nil
}

func (sr *SkillRepo) Create(s *model.Skill) error {
	return sr.DB.QueryRow(
		`INSERT INTO skills(name,created_at,updated_at) VALUES($1,NOW(),NOW()) RETURNING id`,
		s.Name,
	).Scan(&s.ID)
}
