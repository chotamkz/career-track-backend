package postgres

import (
	"database/sql"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
)

type HackathonRepo struct {
	DB *sql.DB
}

func NewHackathonRepo(db *sql.DB) repository.HackathonRepository {
	return &HackathonRepo{DB: db}
}

func (hr *HackathonRepo) CreateHackathon(h *model.Hackathon) error {
	query := `
		INSERT INTO hackathons 
		(name, organizer, start_date, end_date, format, location, theme, prizes, required_skills, website, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`
	return hr.DB.QueryRow(
		query,
		h.Name, h.Organizer, h.StartDate, h.EndDate, h.Format, h.Location, h.Theme, h.Prizes, h.RequiredSkills, h.Website,
	).Scan(&h.ID)
}

func (hr *HackathonRepo) GetHackathons() ([]model.Hackathon, error) {
	query := `
		SELECT id, name, organizer, start_date, end_date, format, location, theme, prizes, required_skills, website, created_at, updated_at
		FROM hackathons
		ORDER BY start_date DESC
	`
	rows, err := hr.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var hackathons []model.Hackathon
	for rows.Next() {
		var h model.Hackathon
		err := rows.Scan(&h.ID, &h.Name, &h.Organizer, &h.StartDate, &h.EndDate, &h.Format, &h.Location, &h.Theme, &h.Prizes, &h.RequiredSkills, &h.Website, &h.CreatedAt, &h.UpdatedAt)
		if err != nil {
			return nil, err
		}
		hackathons = append(hackathons, h)
	}
	return hackathons, nil
}

func (hr *HackathonRepo) GetHackathonByID(id uint) (model.Hackathon, error) {
	query := `
		SELECT id, name, organizer, start_date, end_date, format, location, theme, prizes, required_skills, website, created_at, updated_at
		FROM hackathons
		WHERE id = $1
	`
	var h model.Hackathon
	err := hr.DB.QueryRow(query, id).Scan(
		&h.ID, &h.Name, &h.Organizer, &h.StartDate, &h.EndDate, &h.Format, &h.Location, &h.Theme, &h.Prizes, &h.RequiredSkills, &h.Website, &h.CreatedAt, &h.UpdatedAt,
	)
	if err != nil {
		return model.Hackathon{}, fmt.Errorf("GetHackathonByID: %w", err)
	}
	return h, nil
}
