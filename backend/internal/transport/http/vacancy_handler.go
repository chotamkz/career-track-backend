package http

import (
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"net/http"

	"github.com/gin-gonic/gin"
)

type VacancyHandler struct {
	vacancyUsecase *usecase.VacancyUsecase
	logger         *util.Logger
}

func NewVacancyHandler(vacUsecase *usecase.VacancyUsecase, logger *util.Logger) *VacancyHandler {
	return &VacancyHandler{
		vacancyUsecase: vacUsecase,
		logger:         logger,
	}
}

func (vh *VacancyHandler) ListVacanciesHandler(c *gin.Context) {
	vacancies, err := vh.vacancyUsecase.ListVacancies()
	if err != nil {
		vh.logger.Errorf("Failed to list vacancies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, vacancies)
}
