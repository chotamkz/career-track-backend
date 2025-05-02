package repository

import "github.com/chotamkz/career-track-backend/internal/domain/model"

type VacancyRepository interface {
	GetVacancies(limit, offset int) ([]model.Vacancy, error)
	UpsertVacancy(v *model.Vacancy) error
	GetVacancyById(id uint) (model.Vacancy, error)
	GetFilteredVacancies(filter model.VacancyFilter, limit, offset int) ([]model.Vacancy, error)
	CountFilteredVacancies(filter model.VacancyFilter) (int, error)
	CreateVacancy(v *model.Vacancy) error
	InsertVacancySkill(vacancyID uint, skillName string) error
	GetVacanciesByIDs(ids []uint) ([]model.Vacancy, error)
	CountVacancies() (int, error)
	GetVacanciesByEmployerID(employerID uint) ([]model.Vacancy, error)
	DeleteVacancyByID(vacancyID uint) error
	UpdateVacancy(vac *model.Vacancy) error
	SetSkills(vacancyID uint, skillIDs []uint) error
	GetAllRegions() ([]string, error)
	GetVacanciesWithApplicationStatus(limit, offset int, studentID uint) ([]model.Vacancy, error)
	GetVacancyWithDetails(id uint) (model.VacancyDetailResponse, error)
	GetVacancyWithDetailsAndApplication(id uint, studentID uint) (model.VacancyDetailResponse, error)
}
