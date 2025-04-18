package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type VacancyRepository interface {
	GetVacancies(limit, offset int) ([]model.Vacancy, error)
	UpsertVacancy(v *model.Vacancy) error
	GetVacancyById(id uint) (model.Vacancy, error)
	GetFilteredVacancies(filter model.VacancyFilter) ([]model.Vacancy, error)
	CreateVacancy(v *model.Vacancy) error
	InsertVacancySkill(vacancyID uint, skillName string) error
	GetVacanciesByIDs(ids []uint) ([]model.Vacancy, error)
	CountVacancies() (int, error)
}
