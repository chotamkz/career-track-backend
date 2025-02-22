package postgres

import (
	"database/sql"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
)

type VacancyRepo struct {
	DB *sql.DB
}

func NewVacancyRepo(db *sql.DB) repository.VacancyRepository {
	return &VacancyRepo{DB: db}
}

func (vr *VacancyRepo) GetVacancies() ([]model.Vacancy, error) {
	query := `SELECT id, title, description, requirements, conditions, location, posted_date, employer_id, created_at, updated_at FROM vacancies`
	rows, err := vr.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vacancies []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		err := rows.Scan(
			&v.ID, &v.Title, &v.Description, &v.Requirements, &v.Conditions,
			&v.Location, &v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo, &v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL,
		)
		if err != nil {
			return nil, err
		}
		vacancies = append(vacancies, v)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return vacancies, nil
}
