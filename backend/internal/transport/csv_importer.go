package transport

import (
	"database/sql"
	"encoding/csv"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/util"
	"io"
	"os"
	"strconv"
	"strings"
	"time"
)

// ImportVacanciesFromCSV reads a CSV file and imports vacancies into the database.
func ImportVacanciesFromCSV(filePath string, db *sql.DB, logger *util.Logger) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = ','

	// Read CSV header
	header, err := reader.Read()
	if err != nil {
		return err
	}
	logger.Info("CSV header: " + strings.Join(header, ", "))

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			logger.Errorf("Error reading CSV record: %v", err)
			continue
		}

		var vacancy model.Vacancy
		vacancy.Title = record[1]
		vacancy.Description = record[2]
		vacancy.Requirements = record[3]
		vacancy.Conditions = record[4]
		vacancy.Location = record[5]

		// Parse postedDate
		postedDate, err := time.Parse("2006-01-02T15:04:05-0700", record[6])
		if err != nil {
			logger.Errorf("Failed to parse postedDate '%s': %v", record[6], err)
			continue
		}
		vacancy.PostedDate = postedDate

		// Parse employeeId from CSV and assign to EmployerID.
		// NOTE: We use employeeId as employerId.
		empID, err := strconv.ParseFloat(record[7], 64)
		if err != nil {
			logger.Errorf("Failed to parse employeeId '%s': %v", record[7], err)
			continue
		}
		vacancy.EmployerID = uint(empID)

		// Ensure employer exists in the users table.
		// Use companyName from CSV (record[11])
		err = ensureEmployerExists(db, vacancy.EmployerID, record[11], logger)
		if err != nil {
			logger.Errorf("Failed to ensure employer exists for ID %d: %v", vacancy.EmployerID, err)
			continue
		}

		// Parse createdAt
		createdAt, err := time.Parse("2006-01-02T15:04:05-0700", record[8])
		if err != nil {
			logger.Errorf("Failed to parse createdAt '%s': %v", record[8], err)
			continue
		}
		vacancy.CreatedAt = createdAt

		// Handle salary_from (if empty, set to 0.0)
		if strings.TrimSpace(record[12]) == "" {
			vacancy.SalaryFrom = 0.0
		} else {
			salaryFrom, err := strconv.ParseFloat(record[12], 64)
			if err != nil {
				logger.Errorf("Failed to parse salary_from '%s': %v", record[12], err)
				continue
			}
			vacancy.SalaryFrom = salaryFrom
		}

		// Handle salary_to (if empty, set to 0.0)
		if strings.TrimSpace(record[13]) == "" {
			vacancy.SalaryTo = 0.0
		} else {
			salaryTo, err := strconv.ParseFloat(record[13], 64)
			if err != nil {
				logger.Errorf("Failed to parse salary_to '%s': %v", record[13], err)
				continue
			}
			vacancy.SalaryTo = salaryTo
		}

		vacancy.SalaryCurrency = record[14]

		// Parse salary_gross (if empty, default to false)
		if strings.TrimSpace(record[15]) == "" {
			vacancy.SalaryGross = false
		} else {
			salaryGross, err := strconv.ParseBool(record[15])
			if err != nil {
				logger.Errorf("Failed to parse salary_gross '%s': %v", record[15], err)
				continue
			}
			vacancy.SalaryGross = salaryGross
		}

		vacancy.VacancyURL = record[16]

		// Insert vacancy into DB
		err = insertVacancy(db, &vacancy, logger)
		if err != nil {
			logger.Errorf("Failed to insert vacancy '%s': %v", vacancy.Title, err)
			continue
		}

		// Process key_skills field (record[9])
		keySkills := record[9]
		skills := strings.Split(keySkills, ",")
		for _, s := range skills {
			skillName := strings.TrimSpace(s)
			if skillName == "" {
				continue
			}
			skillID, err := getOrCreateSkill(db, skillName, logger)
			if err != nil {
				logger.Errorf("Failed to get or create skill '%s': %v", skillName, err)
				continue
			}
			err = insertVacancySkill(db, vacancy.ID, skillID, logger)
			if err != nil {
				logger.Errorf("Failed to insert vacancy_skill for vacancy %d and skill %d: %v", vacancy.ID, skillID, err)
				continue
			}
		}

		logger.Info("Imported vacancy: " + vacancy.Title)
	}

	return nil
}

// ensureEmployerExists inserts a minimal user record for an employer if not present.
func ensureEmployerExists(db *sql.DB, employerID uint, companyName string, logger *util.Logger) error {
	// Create a dummy email from companyName: lowercase, remove spaces, append "@example.com"
	dummyEmail := strings.ToLower(strings.ReplaceAll(companyName, " ", "")) + "@example.com"
	// Use a dummy password, e.g., "dummy"
	query := `
		INSERT INTO users (id, name, email, password, user_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'EMPLOYER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT DO NOTHING
	`
	_, err := db.Exec(query, employerID, companyName, dummyEmail, "dummy")
	return err
}

// insertVacancy inserts a vacancy into the vacancies table and sets its ID.
func insertVacancy(db *sql.DB, v *model.Vacancy, logger *util.Logger) error {
	query := `
		INSERT INTO vacancies (title, description, requirements, conditions, location, posted_date, employer_id, created_at, salary_from, salary_to, salary_currency, salary_gross, vacancy_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id
	`
	return db.QueryRow(query, v.Title, v.Description, v.Requirements, v.Conditions, v.Location, v.PostedDate, v.EmployerID, v.CreatedAt, v.SalaryFrom, v.SalaryTo, v.SalaryCurrency, v.SalaryGross, v.VacancyURL).Scan(&v.ID)
}

// getOrCreateSkill retrieves a skill by name or creates it if it doesn't exist.
func getOrCreateSkill(db *sql.DB, name string, logger *util.Logger) (uint, error) {
	var id uint
	querySelect := `SELECT id FROM skills WHERE name = $1`
	err := db.QueryRow(querySelect, name).Scan(&id)
	if err == sql.ErrNoRows {
		queryInsert := `INSERT INTO skills (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`
		err = db.QueryRow(queryInsert, name).Scan(&id)
		if err != nil {
			return 0, err
		}
	} else if err != nil {
		return 0, err
	}
	return id, nil
}

// insertVacancySkill creates an association between a vacancy and a skill.
func insertVacancySkill(db *sql.DB, vacancyID, skillID uint, logger *util.Logger) error {
	query := `
		INSERT INTO vacancy_skills (vacancy_id, skill_id, created_at, updated_at)
		VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT DO NOTHING
	`
	_, err := db.Exec(query, vacancyID, skillID)
	return err
}
