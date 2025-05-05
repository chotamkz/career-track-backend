package postgres

import (
	"database/sql"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"strings"
)

type EmployerRepo struct {
	DB *sql.DB
}

func NewEmployerRepo(db *sql.DB) repository.EmployerRepository {
	return &EmployerRepo{DB: db}
}

func (r *EmployerRepo) GetAllCompanyNames() ([]string, error) {
	const q = `
      SELECT DISTINCT company_name
      FROM employer_profiles
      WHERE company_name <> ''
      ORDER BY company_name
    `
	rows, err := r.DB.Query(q)
	if err != nil {
		return nil, fmt.Errorf("GetAllCompanyNames query: %v", err)
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var n string
		if err := rows.Scan(&n); err != nil {
			return nil, fmt.Errorf("GetAllCompanyNames scan: %v", err)
		}
		names = append(names, n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetAllCompanyNames rows: %v", err)
	}
	return names, nil
}

func (er *EmployerRepo) GetEmployersByIDs(employerIDs []uint) ([]model.EmployerProfile, error) {
	if len(employerIDs) == 0 {
		return []model.EmployerProfile{}, nil
	}

	placeholders := make([]string, len(employerIDs))
	args := make([]interface{}, len(employerIDs))

	for i, id := range employerIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
		SELECT user_id, company_name, company_description, contact_info
		FROM employer_profiles
		WHERE user_id IN (%s)`,
		strings.Join(placeholders, ","))

	rows, err := er.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("GetEmployersByIDs query: %v", err)
	}
	defer rows.Close()

	var employers []model.EmployerProfile
	for rows.Next() {
		var emp model.EmployerProfile
		if err := rows.Scan(
			&emp.UserID,
			&emp.CompanyName,
			&emp.CompanyDescription,
			&emp.ContactInfo,
		); err != nil {
			return nil, fmt.Errorf("scan employer profile: %v", err)
		}
		employers = append(employers, emp)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return employers, nil
}
