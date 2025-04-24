package postgres

import (
	"database/sql"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"strings"
)

type VacancyRepo struct {
	DB *sql.DB
}

func NewVacancyRepo(db *sql.DB) repository.VacancyRepository {
	return &VacancyRepo{DB: db}
}

func (vr *VacancyRepo) CountVacancies() (int, error) {
	var total int
	err := vr.DB.QueryRow(`SELECT COUNT(*) FROM vacancies`).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("CountVacancies: %v", err)
	}
	return total, nil
}

func (vr *VacancyRepo) GetVacancies(limit, offset int) ([]model.Vacancy, error) {
	query := strings.TrimSpace(`
        SELECT 
          id, title, requirements, location, posted_date, employer_id, created_at,
          salary_from, salary_to, salary_currency, salary_gross, vacancy_url,
          work_schedule, experience
        FROM vacancies
        ORDER BY posted_date DESC
        LIMIT $1 OFFSET $2
    `)
	rows, err := vr.DB.Query(query, limit, offset)

	if err != nil {
		return nil, fmt.Errorf("ListVacancies query: %v", err)
	}
	defer rows.Close()

	var vacancies []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		if err := rows.Scan(
			&v.ID, &v.Title, &v.Requirements,
			&v.Location, &v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo, &v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience,
		); err != nil {
			return nil, fmt.Errorf("ListVacancies scan: %v", err)
		}
		vacancies = append(vacancies, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ListVacancies rows: %v", err)
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

func (vr *VacancyRepo) UpdateVacancy(v *model.Vacancy) error {
	const q = `
    UPDATE vacancies SET
      title           = $1,
      description     = $2,
      requirements    = $3,
      location        = $4,
      salary_from     = $5,
      salary_to       = $6,
      salary_currency = $7,
      salary_gross    = $8,
      vacancy_url     = $9,
      work_schedule   = $10,
      experience      = $11,
      updated_at      = NOW()
    WHERE id = $11
    `
	res, err := vr.DB.Exec(q,
		v.Title, v.Description, v.Requirements, v.Location,
		v.SalaryFrom, v.SalaryTo, v.SalaryCurrency, v.SalaryGross,
		v.VacancyURL, v.WorkSchedule, v.Experience,
		v.ID,
	)
	if err != nil {
		return fmt.Errorf("UpdateVacancy exec: %v", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("UpdateVacancy rows: %v", err)
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
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
	skills, err := vr.getSkillsForVacancy(v.ID)
	if err != nil {
		return model.Vacancy{}, fmt.Errorf("GetVacancyById: %w", err)
	}
	v.Skills = skills
	return v, nil
}

func (vr *VacancyRepo) GetFilteredVacancies(filter model.VacancyFilter) ([]model.Vacancy, error) {
	query := `
		SELECT id, title, requirements, location, posted_date, employer_id, created_at, salary_from, salary_to, salary_currency, salary_gross, vacancy_url, work_schedule, experience 
		FROM vacancies 
		WHERE 1=1`
	var args []interface{}
	argIdx := 1

	if filter.Keywords != "" {
		query += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+filter.Keywords+"%")
		argIdx++
	}
	if filter.Region != "" {
		regions := strings.Split(filter.Region, ",")
		var regionConds []string
		for _, region := range regions {
			region = strings.TrimSpace(region)
			if region != "" {
				regionConds = append(regionConds, fmt.Sprintf("location ILIKE $%d", argIdx))
				args = append(args, "%"+region+"%")
				argIdx++
			}
		}
		if len(regionConds) > 0 {
			query += " AND (" + strings.Join(regionConds, " OR ") + ")"
		}
	}
	if filter.Experience != "" {
		query += fmt.Sprintf(" AND experience = $%d", argIdx)
		args = append(args, filter.Experience)
		argIdx++
	}
	if filter.SalaryFrom > 0 {
		query += fmt.Sprintf(" AND salary_from >= $%d", argIdx)
		args = append(args, filter.SalaryFrom)
		argIdx++
	}
	if filter.Schedule != "" {
		query += fmt.Sprintf(" AND work_schedule = $%d", argIdx)
		args = append(args, filter.Schedule)
		argIdx++
	}

	rows, err := vr.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vacancies []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		err := rows.Scan(&v.ID, &v.Title /*&v.Description,*/, &v.Requirements, &v.Location, &v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo, &v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience)
		//skills, err := vr.getSkillsForVacancy(v.ID)
		if err != nil {
			return nil, err
		}
		//v.Skills = skills
		vacancies = append(vacancies, v)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return vacancies, nil
}

func (vr *VacancyRepo) CreateVacancy(v *model.Vacancy) error {
	query := `
		INSERT INTO vacancies 
		(title, description, requirements, location, posted_date, employer_id, created_at, salary_from, salary_to, salary_currency, salary_gross, vacancy_url, work_schedule, experience)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id
	`

	return vr.DB.QueryRow(
		query,
		v.Title, v.Description, v.Requirements, v.Location, v.PostedDate,
		v.EmployerID, v.CreatedAt, v.SalaryFrom, v.SalaryTo, v.SalaryCurrency,
		v.SalaryGross, v.VacancyURL, v.WorkSchedule, v.Experience,
	).Scan(&v.ID)
}

func (vr *VacancyRepo) InsertVacancySkill(vacancyID uint, skillName string) error {
	var skillID uint
	querySelect := `SELECT id FROM skills WHERE name = $1`
	err := vr.DB.QueryRow(querySelect, skillName).Scan(&skillID)
	if err == sql.ErrNoRows {
		queryInsert := `INSERT INTO skills (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`
		err = vr.DB.QueryRow(queryInsert, skillName).Scan(&skillID)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}
	query := `
		INSERT INTO vacancy_skills (vacancy_id, skill_id, created_at, updated_at)
		VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT DO NOTHING
	`
	_, err = vr.DB.Exec(query, vacancyID, skillID)
	return err
}

func (vr *VacancyRepo) getSkillsForVacancy(vacancyID uint) ([]string, error) {
	query := `
		SELECT s.name 
		FROM vacancy_skills vs
		JOIN skills s ON vs.skill_id = s.id
		WHERE vs.vacancy_id = $1
	`
	rows, err := vr.DB.Query(query, vacancyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []string
	for rows.Next() {
		var skill string
		if err := rows.Scan(&skill); err != nil {
			return nil, err
		}
		skills = append(skills, skill)
	}
	return skills, nil
}

func (vr *VacancyRepo) GetVacanciesByIDs(ids []uint) ([]model.Vacancy, error) {
	if len(ids) == 0 {
		return []model.Vacancy{}, nil
	}
	params := make([]interface{}, len(ids))
	placeholders := make([]string, len(ids))
	for i, id := range ids {
		params[i] = id
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}
	query := fmt.Sprintf(`
		SELECT id, title, requirements, location, posted_date, employer_id, created_at, salary_from, salary_to, salary_currency, salary_gross, vacancy_url, work_schedule, experience
		FROM vacancies
		WHERE id IN (%s)
	`, strings.Join(placeholders, ","))
	rows, err := vr.DB.Query(query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vacancies []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		err := rows.Scan(&v.ID, &v.Title /*&v.Description,*/, &v.Requirements, &v.Location, &v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo, &v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience)
		if err != nil {
			return nil, err
		}
		vacancies = append(vacancies, v)
	}
	return vacancies, nil
}

func (vr *VacancyRepo) GetVacanciesByEmployerID(employerID uint) ([]model.Vacancy, error) {
	const query = `
        SELECT 
          id, title, requirements, location, posted_date, employer_id, created_at,
          salary_from, salary_to, salary_currency, salary_gross, vacancy_url,
          work_schedule, experience
        FROM vacancies
        WHERE employer_id = $1
        ORDER BY posted_date DESC
    `
	rows, err := vr.DB.Query(query, employerID)
	if err != nil {
		return nil, fmt.Errorf("GetVacanciesByEmployerID: %v", err)
	}
	defer rows.Close()

	var vacs []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		if err := rows.Scan(
			&v.ID, &v.Title, &v.Requirements, &v.Location, &v.PostedDate,
			&v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo,
			&v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL,
			&v.WorkSchedule, &v.Experience,
		); err != nil {
			return nil, fmt.Errorf("scan vacancy: %v", err)
		}
		vacs = append(vacs, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %v", err)
	}
	return vacs, nil
}

func (vr *VacancyRepo) DeleteVacancyByID(vacancyID uint) error {
	res, err := vr.DB.Exec(`DELETE FROM vacancies WHERE id = $1`, vacancyID)
	if err != nil {
		return fmt.Errorf("DeleteVacancyByID exec: %v", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("DeleteVacancyByID rows: %v", err)
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}
