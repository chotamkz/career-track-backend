package postgres

import (
	"database/sql"
	"fmt"
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
	query := `SELECT id, title, description, requirements, location, posted_date, employer_id, created_at, salary_from, salary_to, salary_currency, salary_gross, vacancy_url, work_schedule, experience  FROM vacancies`
	rows, err := vr.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vacancies []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		err := rows.Scan(
			&v.ID, &v.Title, &v.Description, &v.Requirements,
			&v.Location, &v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo, &v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience,
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

func (vr *VacancyRepo) UpsertVacancy(v *model.Vacancy) error {
	query := `
		INSERT INTO vacancies (title, description, requirements, location, posted_date, employer_id, created_at, salary_from, salary_to, salary_currency, salary_gross, vacancy_url, work_schedule, experience)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT (vacancy_url) DO UPDATE SET
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			requirements = EXCLUDED.requirements,
			location = EXCLUDED.location,
			posted_date = EXCLUDED.posted_date,
			employer_id = EXCLUDED.employer_id,
			salary_from = EXCLUDED.salary_from,
			salary_to = EXCLUDED.salary_to,
			salary_currency = EXCLUDED.salary_currency,
			salary_gross = EXCLUDED.salary_gross,
			work_schedule = EXCLUDED.work_schedule,
			experience = EXCLUDED.experience
		RETURNING id
	`
	return vr.DB.QueryRow(query, v.Title, v.Description, v.Requirements, v.Location, v.PostedDate, v.EmployerID, v.CreatedAt, v.SalaryFrom, v.SalaryTo, v.SalaryCurrency, v.SalaryGross, v.VacancyURL, v.WorkSchedule, v.Experience).Scan(&v.ID)
}

func (vr *VacancyRepo) GetVacancyById(id uint) (model.Vacancy, error) {
	query := `
		SELECT id, title, description, requirements, location, posted_date, employer_id, created_at, salary_from, salary_to, salary_currency, salary_gross, vacancy_url, work_schedule, experience
		FROM vacancies
		WHERE id = $1
    `
	var v model.Vacancy
	err := vr.DB.QueryRow(query, id).Scan(
		&v.ID, &v.Title, &v.Description, &v.Requirements, &v.Location,
		&v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo, &v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience,
	)

	if err != nil {
		return model.Vacancy{}, fmt.Errorf("GetVacancyById: %w", err)
	}
	return v, nil
}
