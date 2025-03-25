package usecase

import (
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"github.com/chotamkz/career-track-backend/internal/integration/hh"
	"github.com/chotamkz/career-track-backend/internal/util"
	"strconv"
)

type VacancyUpdater struct {
	UserRepo       repository.UserRepository
	VacancyRepo    repository.VacancyRepository
	vacancyUsecase *VacancyUsecase
	Logger         *util.Logger
}

func NewVacancyUpdater(userRepo repository.UserRepository, vacancyRepo repository.VacancyRepository, vacUsecase *VacancyUsecase, logger *util.Logger) *VacancyUpdater {
	return &VacancyUpdater{
		UserRepo:       userRepo,
		VacancyRepo:    vacancyRepo,
		vacancyUsecase: vacUsecase,
		Logger:         logger,
	}
}

func (vu *VacancyUpdater) UpdateVacancies(perPage, page int) error {
	hhVacancies, err := hh.FetchITVacancies(perPage, page, vu.Logger)
	if err != nil {
		return fmt.Errorf("failed to fetch vacancies from HH API: %v", err)
	}

	for _, hhVac := range hhVacancies {
		empID, err := strconv.ParseUint(hhVac.Employer.ID, 10, 32)
		if err != nil {
			vu.Logger.Errorf("Failed to parse employer ID '%s': %v", hhVac.Employer.ID, err)
			continue
		}

		if err := vu.UserRepo.EnsureEmployerExists(uint(empID), hhVac.Employer.Name); err != nil {
			vu.Logger.Errorf("Failed to ensure employer exists for ID %d: %v", uint(empID), err)
			continue
		}

		vacancy := hh.MapHHVacancyToInternal(hhVac, vu.Logger)
		if err := vu.VacancyRepo.UpsertVacancy(&vacancy); err != nil {
			vu.Logger.Errorf("Failed to upsert vacancy '%s': %v", vacancy.Title, err)
			continue
		}

		if len(vacancy.Skills) > 0 {
			if err := vu.vacancyUsecase.AddSkillsToVacancy(vacancy.ID, vacancy.Skills); err != nil {
				vu.Logger.Errorf("Failed to add skills to vacancy '%s': %v", vacancy.Title, err)
			}
		}

		vu.Logger.Info("Upserted vacancy: " + vacancy.Title)
	}
	return nil
}
