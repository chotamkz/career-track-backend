package usecase

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"strings"
)

type VacancyUsecase struct {
	vacancyRepo repository.VacancyRepository
}

func NewVacancyUsecase(vacRepo repository.VacancyRepository) *VacancyUsecase {
	return &VacancyUsecase{
		vacancyRepo: vacRepo,
	}
}

func (vu *VacancyUsecase) ListVacancies() ([]model.Vacancy, error) {
	return vu.vacancyRepo.GetVacancies()
}

func (vu *VacancyUsecase) GetVacancyById(id uint) (model.Vacancy, error) {
	return vu.vacancyRepo.GetVacancyById(id)
}

func (vu *VacancyUsecase) FilterVacancies(filter model.VacancyFilter) ([]model.Vacancy, error) {
	return vu.vacancyRepo.GetFilteredVacancies(filter)
}

func (vu *VacancyUsecase) CreateVacancy(v *model.Vacancy) error {
	return vu.vacancyRepo.CreateVacancy(v)
}

func (vu *VacancyUsecase) AddSkillsToVacancy(vacancyID uint, skills []string) error {
	for _, s := range skills {
		skillName := strings.TrimSpace(s)
		if skillName == "" {
			continue
		}
		if err := vu.vacancyRepo.InsertVacancySkill(vacancyID, skillName); err != nil {
			return err
		}
	}
	return nil
}
