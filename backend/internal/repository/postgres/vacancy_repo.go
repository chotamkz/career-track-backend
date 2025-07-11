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
	query := `
        SELECT 
            id, title, requirements, location, posted_date, employer_id, created_at,
            salary_from, salary_to, salary_currency, salary_gross, vacancy_url,
            work_schedule, experience
        FROM vacancies
        ORDER BY posted_date DESC
        LIMIT $1 OFFSET $2
    `
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
			&v.Location, &v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo,
			&v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience,
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
        WITH upsert AS (
            INSERT INTO vacancies (
                title, description, requirements, location, posted_date, employer_id, created_at,
                salary_from, salary_to, salary_currency, salary_gross, vacancy_url, work_schedule, experience
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (vacancy_url) WHERE vacancy_url IS NOT NULL 
            DO UPDATE SET
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
        )
        SELECT id FROM upsert
        UNION ALL
        SELECT id FROM vacancies WHERE vacancy_url = $12 AND $12 IS NOT NULL
        LIMIT 1
    `

	var id uint
	var err error

	if !v.VacancyURL.Valid || v.VacancyURL.String == "" {
		insertQuery := `
            INSERT INTO vacancies (
                title, description, requirements, location, posted_date, employer_id, created_at,
                salary_from, salary_to, salary_currency, salary_gross, vacancy_url, work_schedule, experience
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
        `
		err = vr.DB.QueryRow(insertQuery, v.Title, v.Description, v.Requirements, v.Location, v.PostedDate,
			v.EmployerID, v.CreatedAt, v.SalaryFrom, v.SalaryTo, v.SalaryCurrency,
			v.SalaryGross, v.VacancyURL, v.WorkSchedule, v.Experience).Scan(&id)
	} else {
		err = vr.DB.QueryRow(query, v.Title, v.Description, v.Requirements, v.Location, v.PostedDate,
			v.EmployerID, v.CreatedAt, v.SalaryFrom, v.SalaryTo, v.SalaryCurrency,
			v.SalaryGross, v.VacancyURL.String, v.WorkSchedule, v.Experience).Scan(&id)
	}

	if err != nil {
		return err
	}

	v.ID = id
	return nil
}

func (vr *VacancyRepo) UpdateVacancy(v *model.Vacancy) error {
	const q = `
    UPDATE vacancies SET
      title           = $1,
      description     = $2,
      location        = $3,
      salary_from     = $4,
      salary_to       = $5,
      salary_currency = $6,
      salary_gross    = $7,
      vacancy_url     = $8,
      work_schedule   = $9,
      experience      = $10,
      updated_at      = NOW()
    WHERE id = $11
    `
	res, err := vr.DB.Exec(q,
		v.Title, v.Description, v.Location,
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

func (vr *VacancyRepo) GetVacancyWithDetails(id uint) (model.VacancyDetailResponse, error) {
	query := `
        SELECT 
            v.id, v.title, v.description, v.requirements, v.location, 
            v.posted_date, v.employer_id, v.created_at, v.salary_from, v.salary_to, 
            v.salary_currency, v.salary_gross, v.vacancy_url, v.work_schedule, v.experience,
            e.company_name
        FROM 
            vacancies v
        JOIN 
            employer_profiles e ON v.employer_id = e.user_id
        WHERE 
            v.id = $1
    `

	var result model.VacancyDetailResponse
	var v model.Vacancy

	err := vr.DB.QueryRow(query, id).Scan(
		&v.ID, &v.Title, &v.Description, &v.Requirements, &v.Location,
		&v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo,
		&v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience,
		&result.CompanyName,
	)
	if err != nil {
		return model.VacancyDetailResponse{}, fmt.Errorf("GetVacancyWithDetails: %w", err)
	}

	// Получаем навыки для вакансии
	skills, err := vr.getSkillsForVacancy(v.ID)
	if err != nil {
		return model.VacancyDetailResponse{}, fmt.Errorf("GetVacancyWithDetails skills: %w", err)
	}
	v.Skills = skills

	result.Vacancy = v
	return result, nil
}

func (vr *VacancyRepo) GetVacancyWithDetailsAndApplication(id uint, studentID uint) (model.VacancyDetailResponse, error) {
	query := `
        SELECT 
            v.id, v.title, v.description, v.requirements, v.location, 
            v.posted_date, v.employer_id, v.created_at, v.salary_from, v.salary_to, 
            v.salary_currency, v.salary_gross, v.vacancy_url, v.work_schedule, v.experience,
            e.company_name,
            a.status
        FROM 
            vacancies v
        JOIN 
            employer_profiles e ON v.employer_id = e.user_id
        LEFT JOIN 
            (SELECT vacancy_id, status FROM applications 
             WHERE student_id = $2 AND vacancy_id = $1
             ORDER BY submitted_date DESC LIMIT 1) a ON v.id = a.vacancy_id
        WHERE 
            v.id = $1
    `

	var result model.VacancyDetailResponse
	var v model.Vacancy
	var appStatus sql.NullString

	err := vr.DB.QueryRow(query, id, studentID).Scan(
		&v.ID, &v.Title, &v.Description, &v.Requirements, &v.Location,
		&v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo,
		&v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience,
		&result.CompanyName,
		&appStatus,
	)
	if err != nil {
		return model.VacancyDetailResponse{}, fmt.Errorf("GetVacancyWithDetailsAndApplication: %w", err)
	}

	skills, err := vr.getSkillsForVacancy(v.ID)
	if err != nil {
		return model.VacancyDetailResponse{}, fmt.Errorf("GetVacancyWithDetailsAndApplication skills: %w", err)
	}
	v.Skills = skills

	if appStatus.Valid {
		status := appStatus.String
		result.ApplicationStatus = (*model.ApplicationStatus)(&status)
	}

	result.Vacancy = v
	return result, nil
}

func (vr *VacancyRepo) CountFilteredVacancies(filter model.VacancyFilter) (int, error) {
	query := `
		SELECT COUNT(*) 
		FROM vacancies v
		JOIN employer_profiles ep ON v.employer_id = ep.user_id
		WHERE 1=1`
	var args []interface{}
	idx := 1

	if filter.Keywords != "" {
		query += fmt.Sprintf(" AND (v.title ILIKE $%d OR v.description ILIKE $%d)", idx, idx)
		args = append(args, "%"+filter.Keywords+"%")
		idx++
	}
	if filter.Region != "" {
		regions := strings.Split(filter.Region, ",")
		var conds []string
		for _, r := range regions {
			conds = append(conds, fmt.Sprintf("v.location ILIKE $%d", idx))
			args = append(args, "%"+strings.TrimSpace(r)+"%")
			idx++
		}
		query += " AND (" + strings.Join(conds, " OR ") + ")"
	}
	if filter.Experience != "" {
		query += fmt.Sprintf(" AND v.experience = $%d", idx)
		args = append(args, filter.Experience)
		idx++
	}
	if filter.SalaryFrom > 0 {
		query += fmt.Sprintf(" AND v.salary_from >= $%d", idx)
		args = append(args, filter.SalaryFrom)
		idx++
	}
	if filter.Schedule != "" {
		query += fmt.Sprintf(" AND v.work_schedule = $%d", idx)
		args = append(args, filter.Schedule)
		idx++
	}
	if filter.CompanyName != "" {
		query += fmt.Sprintf(" AND ep.company_name ILIKE $%d", idx)
		args = append(args, "%"+filter.CompanyName+"%")
		idx++
	}

	var total int
	err := vr.DB.QueryRow(query, args...).Scan(&total)
	return total, err
}

func (vr *VacancyRepo) GetFilteredVacancies(filter model.VacancyFilter, limit, offset int) ([]model.Vacancy, error) {
	query := `
		SELECT v.id, v.title, v.requirements, v.location, v.posted_date, v.employer_id, v.created_at, 
		       v.salary_from, v.salary_to, v.salary_currency, v.salary_gross, v.vacancy_url, v.work_schedule, v.experience 
		FROM vacancies v
		JOIN employer_profiles ep ON v.employer_id = ep.user_id
		WHERE 1=1`
	var args []interface{}
	argIdx := 1

	if filter.Keywords != "" {
		query += fmt.Sprintf(" AND (v.title ILIKE $%d OR v.description ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+filter.Keywords+"%")
		argIdx++
	}
	if filter.Region != "" {
		regions := strings.Split(filter.Region, ",")
		var regionConds []string
		for _, region := range regions {
			region = strings.TrimSpace(region)
			if region != "" {
				regionConds = append(regionConds, fmt.Sprintf("v.location ILIKE $%d", argIdx))
				args = append(args, "%"+region+"%")
				argIdx++
			}
		}
		if len(regionConds) > 0 {
			query += " AND (" + strings.Join(regionConds, " OR ") + ")"
		}
	}
	if filter.Experience != "" {
		query += fmt.Sprintf(" AND v.experience = $%d", argIdx)
		args = append(args, filter.Experience)
		argIdx++
	}
	if filter.SalaryFrom > 0 {
		query += fmt.Sprintf(" AND v.salary_from >= $%d", argIdx)
		args = append(args, filter.SalaryFrom)
		argIdx++
	}
	if filter.Schedule != "" {
		query += fmt.Sprintf(" AND v.work_schedule = $%d", argIdx)
		args = append(args, filter.Schedule)
		argIdx++
	}
	if filter.CompanyName != "" {
		query += fmt.Sprintf(" AND ep.company_name ILIKE $%d", argIdx)
		args = append(args, "%"+filter.CompanyName+"%")
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY v.posted_date DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := vr.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("GetFilteredVacancies query: %v", err)
	}
	defer rows.Close()

	var vacs []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		if err := rows.Scan(
			&v.ID, &v.Title, &v.Requirements, &v.Location, &v.PostedDate,
			&v.EmployerID, &v.CreatedAt,
			&v.SalaryFrom, &v.SalaryTo, &v.SalaryCurrency, &v.SalaryGross,
			&v.VacancyURL, &v.WorkSchedule, &v.Experience,
		); err != nil {
			return nil, fmt.Errorf("scan vacancy: %v", err)
		}
		vacs = append(vacs, v)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return vacs, nil
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
		return nil, fmt.Errorf("getSkillsForVacancy: %w", err)
	}
	defer rows.Close()

	var skills []string
	for rows.Next() {
		var skill string
		if err := rows.Scan(&skill); err != nil {
			return nil, fmt.Errorf("getSkillsForVacancy scan: %w", err)
		}
		skills = append(skills, skill)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("getSkillsForVacancy rows: %w", err)
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

func (vr *VacancyRepo) SetSkills(vacancyID uint, skillIDs []uint) error {
	tx, err := vr.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM vacancy_skills WHERE vacancy_id = $1`, vacancyID); err != nil {
		return err
	}
	stmt, err := tx.Prepare(`INSERT INTO vacancy_skills(vacancy_id, skill_id, created_at, updated_at) VALUES($1,$2,NOW(),NOW())`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, sid := range skillIDs {
		if _, err := stmt.Exec(vacancyID, sid); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (vr *VacancyRepo) GetAllRegions() ([]string, error) {
	const q = `
      SELECT DISTINCT trim(split_part(location, ',', 1)) AS city
      FROM vacancies
      WHERE location IS NOT NULL AND location <> ''
      ORDER BY city
    `
	rows, err := vr.DB.Query(q)
	if err != nil {
		return nil, fmt.Errorf("GetAllRegions query: %v", err)
	}
	defer rows.Close()

	var regions []string
	for rows.Next() {
		var city string
		if err := rows.Scan(&city); err != nil {
			return nil, fmt.Errorf("GetAllRegions scan: %v", err)
		}
		regions = append(regions, city)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetAllRegions rows: %v", err)
	}
	return regions, nil
}

func (vr *VacancyRepo) GetVacanciesWithApplicationStatus(limit, offset int, studentID uint) ([]model.Vacancy, error) {
	query := `
        SELECT 
            v.id, v.title, v.requirements, v.location, v.posted_date, v.employer_id, v.created_at,
            v.salary_from, v.salary_to, v.salary_currency, v.salary_gross, v.vacancy_url,
            v.work_schedule, v.experience,
            CASE WHEN a.vacancy_id IS NOT NULL THEN true ELSE false END AS applied
        FROM 
            vacancies v
        LEFT JOIN 
            (SELECT vacancy_id, status FROM applications WHERE student_id = $3) a 
            ON v.id = a.vacancy_id
        ORDER BY 
            v.posted_date DESC
        LIMIT $1 OFFSET $2
    `

	rows, err := vr.DB.Query(query, limit, offset, studentID)
	if err != nil {
		return nil, fmt.Errorf("GetVacanciesWithApplicationStatus query: %v", err)
	}
	defer rows.Close()

	var vacancies []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		if err := rows.Scan(
			&v.ID, &v.Title, &v.Requirements,
			&v.Location, &v.PostedDate, &v.EmployerID, &v.CreatedAt, &v.SalaryFrom, &v.SalaryTo,
			&v.SalaryCurrency, &v.SalaryGross, &v.VacancyURL, &v.WorkSchedule, &v.Experience,
			&v.Applied,
		); err != nil {
			return nil, fmt.Errorf("GetVacanciesWithApplicationStatus scan: %v", err)
		}
		vacancies = append(vacancies, v)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetVacanciesWithApplicationStatus rows: %v", err)
	}

	return vacancies, nil
}
