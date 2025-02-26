package scheduler

import (
	"database/sql"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"strconv"
	"time"
)

type VacancyScheduler struct {
	VacancyUpdater *usecase.VacancyUpdater
	Logger         *util.Logger
	PerPage        int
	TotalPages     int
	Interval       time.Duration
}

func NewVacancyScheduler(db *sql.DB, userRepo repository.UserRepository, vacancyRepo repository.VacancyRepository, logger *util.Logger, perPage, totalPages int, interval time.Duration) *VacancyScheduler {
	updater := usecase.NewVacancyUpdater(userRepo, vacancyRepo, logger)
	return &VacancyScheduler{
		VacancyUpdater: updater,
		Logger:         logger,
		PerPage:        perPage,
		TotalPages:     totalPages,
		Interval:       interval,
	}
}

func (vs *VacancyScheduler) Start() {
	vs.Logger.Info("Starting vacancy updater scheduler")
	go func() {
		ticker := time.NewTicker(vs.Interval)
		defer ticker.Stop()
		for {
			vs.Logger.Info("Starting vacancy update cycle")
			for page := 0; page < vs.TotalPages; page++ {
				vs.Logger.Info("Updating vacancies from HH API for page " + strconv.Itoa(page))
				if err := vs.VacancyUpdater.UpdateVacancies(vs.PerPage, page); err != nil {
					vs.Logger.Errorf("Error updating vacancies on page %d: %v", page, err)
				}
				time.Sleep(2 * time.Second)
			}
			vs.Logger.Info("Vacancy update cycle completed")
			<-ticker.C
		}
	}()
}
