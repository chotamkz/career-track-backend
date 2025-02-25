package transport

import (
	"database/sql"
	"encoding/csv"
	"fmt"
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

	// Create a map to cache skills
	skillCache := make(map[string]uint)
	// Create a map to cache employers (to avoid redundant checks)
	employerCache := make(map[uint]bool)

	const batchSize = 10
	var records [][]string
	recordCount := 0

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			logger.Errorf("Error reading CSV record: %v", err)
			continue
		}

		records = append(records, record)
		recordCount++

		// Process in small batches
		if len(records) >= batchSize {
			if err := processBatch(records, db, skillCache, employerCache, logger); err != nil {
				logger.Errorf("Error processing batch: %v", err)
				// Continue with next batch instead of failing entire import
			}
			records = records[:0] // Clear records but keep capacity
		}
	}

	successCount := 0
	errorCount := 0

	// После процессинга каждой партии:
	if err := processBatch(records, db, skillCache, employerCache, logger); err != nil {
		logger.Errorf("Error processing batch: %v", err)
		errorCount++
	} else {
		successCount += len(records)
	}

	// В конце:
	if errorCount > 0 {
		logger.Warnf("CSV import completed with errors. Successful: %d, Error batches: %d",
			successCount, errorCount)
		return fmt.Errorf("import completed with %d error batches", errorCount)
	}

	logger.Infof("CSV import completed successfully. Records imported: %d", successCount)
	return nil
}

func processBatch(records [][]string, db *sql.DB, skillCache map[string]uint, employerCache map[uint]bool, logger *util.Logger) error {
	// Start a new transaction for each batch
	var err error
	var tx *sql.Tx

	for retries := 0; retries < 3; retries++ {
		tx, err = db.Begin()
		if err == nil {
			break
		}
		logger.Errorf("Failed to begin transaction (attempt %d): %v", retries+1, err)
		time.Sleep(time.Second * time.Duration(retries+1))
	}

	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			tx.Rollback()
			logger.Errorf("Transaction rolled back: %v", err)
		}
	}()

	for _, record := range records {
		var vacancy model.Vacancy
		vacancy.Title = record[1]
		vacancy.Description = record[2]
		vacancy.Requirements = record[3]
		vacancy.Conditions = record[4]
		vacancy.Country = record[5]
		vacancy.Location = record[6]

		// Parse postedDate
		postedDate, err := time.Parse("2006-01-02T15:04:05-0700", record[7])
		if err != nil {
			logger.Errorf("Failed to parse postedDate '%s': %v", record[7], err)
			continue
		}
		vacancy.PostedDate = postedDate

		// Parse employeeId from CSV
		empID, err := strconv.ParseFloat(record[8], 64)
		if err != nil {
			logger.Errorf("Failed to parse employeeId '%s': %v", record[8], err)
			continue
		}
		vacancy.EmployerID = uint(empID)

		// Check employer cache first
		if _, exists := employerCache[vacancy.EmployerID]; !exists {
			// Ensure employer exists
			companyName := record[12]
			err = ensureEmployerExists(tx, vacancy.EmployerID, companyName, logger)
			if err != nil {
				logger.Errorf("Failed to ensure employer exists for ID %d: %v", vacancy.EmployerID, err)
				continue
			}
			employerCache[vacancy.EmployerID] = true
		}

		// Parse createdAt
		createdAt, err := time.Parse("2006-01-02T15:04:05-0700", record[9])
		if err != nil {
			logger.Errorf("Failed to parse createdAt '%s': %v", record[9], err)
			continue
		}
		vacancy.CreatedAt = createdAt

		// Handle salary fields
		if strings.TrimSpace(record[13]) == "" {
			vacancy.SalaryFrom = 0.0
		} else {
			salaryFrom, err := strconv.ParseFloat(record[13], 64)
			if err != nil {
				logger.Errorf("Failed to parse salary_from '%s': %v", record[13], err)
				continue
			}
			vacancy.SalaryFrom = salaryFrom
		}

		if strings.TrimSpace(record[14]) == "" {
			vacancy.SalaryTo = 0.0
		} else {
			salaryTo, err := strconv.ParseFloat(record[14], 64)
			if err != nil {
				logger.Errorf("Failed to parse salary_to '%s': %v", record[14], err)
				continue
			}
			vacancy.SalaryTo = salaryTo
		}

		vacancy.SalaryCurrency = record[15]

		if strings.TrimSpace(record[16]) == "" {
			vacancy.SalaryGross = false
		} else {
			salaryGross, err := strconv.ParseBool(record[16])
			if err != nil {
				logger.Errorf("Failed to parse salary_gross '%s': %v", record[16], err)
				continue
			}
			vacancy.SalaryGross = salaryGross
		}

		vacancy.VacancyURL = record[17]

		// Insert vacancy directly (avoid prepared statements)
		err = insertVacancy(tx, &vacancy, logger)
		if err != nil {
			logger.Errorf("Failed to insert vacancy '%s': %v", vacancy.Title, err)
			continue
		}

		// Process skills
		keySkills := record[10]
		skills := strings.Split(keySkills, ",")
		for _, s := range skills {
			skillName := strings.TrimSpace(s)
			if skillName == "" {
				continue
			}

			var skillID uint
			var ok bool

			// Check cache first
			if skillID, ok = skillCache[skillName]; !ok {
				// Not in cache, query or create
				skillID, err = getOrCreateSkill(tx, skillName, logger)
				if err != nil {
					logger.Errorf("Failed to get or create skill '%s': %v", skillName, err)
					continue
				}
				// Update cache
				skillCache[skillName] = skillID
			}

			// Insert vacancy-skill relation
			err = insertVacancySkill(tx, vacancy.ID, skillID, logger)
			if err != nil {
				logger.Errorf("Failed to insert vacancy_skill for vacancy %d and skill %d: %v", vacancy.ID, skillID, err)
				continue
			}
		}

		logger.Info("Imported vacancy: " + vacancy.Title)
	}

	// Commit the transaction for this batch
	return tx.Commit()
}

// ensureEmployerExists inserts a minimal user record for an employer if not present.
func ensureEmployerExists(tx *sql.Tx, employerID uint, companyName string, logger *util.Logger) error {
	// Check if employer exists
	var count int
	err := tx.QueryRow("SELECT COUNT(*) FROM users WHERE id = $1", employerID).Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Employer already exists
	}

	// Create a dummy email from companyName
	dummyEmail := strings.ToLower(strings.ReplaceAll(companyName, " ", "")) + "@example.com"

	// Insert the employer
	query := `
		INSERT INTO users (id, name, email, password, user_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'EMPLOYER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT DO NOTHING
	`
	_, err = tx.Exec(query, employerID, companyName, dummyEmail, "dummy")
	return err
}

// insertVacancy inserts a vacancy into the vacancies table and sets its ID.
func insertVacancy(tx *sql.Tx, v *model.Vacancy, logger *util.Logger) error {
	query := `
		INSERT INTO vacancies (title, description, requirements, conditions, location, posted_date, employer_id, created_at, salary_from, salary_to, salary_currency, salary_gross, vacancy_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id
	`
	return tx.QueryRow(query, v.Title, v.Description, v.Requirements, v.Conditions, v.Location, v.PostedDate, v.EmployerID, v.CreatedAt, v.SalaryFrom, v.SalaryTo, v.SalaryCurrency, v.SalaryGross, v.VacancyURL).Scan(&v.ID)
}

// getOrCreateSkill retrieves a skill by name or creates it if it doesn't exist.
func getOrCreateSkill(tx *sql.Tx, name string, logger *util.Logger) (uint, error) {
	var id uint
	querySelect := `SELECT id FROM skills WHERE name = $1`
	err := tx.QueryRow(querySelect, name).Scan(&id)
	if err == sql.ErrNoRows {
		queryInsert := `INSERT INTO skills (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`
		err = tx.QueryRow(queryInsert, name).Scan(&id)
		if err != nil {
			return 0, err
		}
	} else if err != nil {
		return 0, err
	}
	return id, nil
}

// insertVacancySkill creates an association between a vacancy and a skill.
func insertVacancySkill(tx *sql.Tx, vacancyID, skillID uint, logger *util.Logger) error {
	query := `
		INSERT INTO vacancy_skills (vacancy_id, skill_id, created_at, updated_at)
		VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT DO NOTHING
	`
	_, err := tx.Exec(query, vacancyID, skillID)
	return err
}
