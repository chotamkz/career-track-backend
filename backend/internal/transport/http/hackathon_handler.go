package http

import (
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/usecase"
	"github.com/chotamkz/career-track-backend/internal/util"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type HackathonHandler struct {
	hackUsecase *usecase.HackathonUsecase
	logger      *util.Logger
}

func NewHackathonHandler(hackUsecase *usecase.HackathonUsecase, logger *util.Logger) *HackathonHandler {
	return &HackathonHandler{hackUsecase: hackUsecase, logger: logger}
}

func (hh *HackathonHandler) CreateHackathonHandler(c *gin.Context) {
	var hack model.Hackathon
	if err := c.ShouldBindJSON(&hack); err != nil {
		hh.logger.Errorf("Invalid hackathon input: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	if hack.EndDate.IsZero() {
		hack.EndDate = hack.StartDate
	}
	hack.CreatedAt = time.Now()
	hack.UpdatedAt = time.Now()

	if err := hh.hackUsecase.CreateHackathon(&hack); err != nil {
		hh.logger.Errorf("Failed to create hackathon: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create hackathon"})
		return
	}
	c.JSON(http.StatusCreated, hack)
}

func (hh *HackathonHandler) GetHackathonsHandler(c *gin.Context) {
	hackathons, err := hh.hackUsecase.GetHackathons()
	if err != nil {
		hh.logger.Errorf("Failed to get hackathons: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get hackathons"})
		return
	}
	c.JSON(http.StatusOK, hackathons)
}

func (hh *HackathonHandler) DetailHackathonHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		hh.logger.Errorf("Invalid hackathon id: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid hackathon id"})
		return
	}
	hack, err := hh.hackUsecase.GetHackathonByID(uint(id))
	if err != nil {
		hh.logger.Errorf("Failed to get hackathon detail: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get hackathon detail"})
		return
	}
	c.JSON(http.StatusOK, hack)
}
