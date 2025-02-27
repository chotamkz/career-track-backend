package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type VacancyRepository interface {
	GetVacancies() ([]model.Vacancy, error)
	UpsertVacancy(v *model.Vacancy) error
	GetVacancyById(id uint) (model.Vacancy, error)
}
