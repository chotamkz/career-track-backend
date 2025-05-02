package postgres

import (
	"database/sql"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
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
