package postgres

import (
	"database/sql"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"time"
)

type ApplicationRepo struct {
	DB *sql.DB
}

func NewApplicationRepo(db *sql.DB) repository.ApplicationRepository {
	return &ApplicationRepo{DB: db}
}

func (ar *ApplicationRepo) CreateApplication(app *model.Application) error {
	query := `
		INSERT INTO applications (student_id, vacancy_id, cover_letter, submitted_date, status, updated_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`
	err := ar.DB.QueryRow(query, app.StudentID, app.VacancyID, app.CoverLetter, app.SubmittedDate, app.Status, app.UpdatedDate).Scan(&app.ID)
	if err != nil {
		return fmt.Errorf("CreateApplication: %v", err)
	}
	return nil
}

func (ar *ApplicationRepo) UpdateApplicationStatus(appID uint, newStatus model.ApplicationStatus) error {
	query := `
		UPDATE applications 
		SET status = $1, updated_date = $2
		WHERE id = $3
	`
	res, err := ar.DB.Exec(query, newStatus, time.Now(), appID)
	if err != nil {
		return fmt.Errorf("UpdateApplicationStatus: %v", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("UpdateApplicationStatus (rows): %v", err)
	}
	if rows == 0 {
		return fmt.Errorf("UpdateApplicationStatus: no application found with id %d", appID)
	}
	return nil
}

func (ar *ApplicationRepo) GetApplicationsByStudentID(studentID uint) ([]model.Application, error) {
	query := `
		SELECT id, student_id, vacancy_id, cover_letter, submitted_date, status, updated_date
		FROM applications
		WHERE student_id = $1
		ORDER BY submitted_date DESC
	`
	rows, err := ar.DB.Query(query, studentID)
	if err != nil {
		return nil, fmt.Errorf("GetApplicationsByStudentID: %v", err)
	}
	defer rows.Close()

	var apps []model.Application
	for rows.Next() {
		var app model.Application
		if err := rows.Scan(&app.ID, &app.StudentID, &app.VacancyID, &app.CoverLetter, &app.SubmittedDate, &app.Status, &app.UpdatedDate); err != nil {
			return nil, fmt.Errorf("GetApplicationsByStudentID scan: %v", err)
		}
		apps = append(apps, app)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("GetApplicationsByStudentID rows: %v", err)
	}
	return apps, nil
}

func (ar *ApplicationRepo) GetApplicationByID(appID uint) (model.Application, error) {
	query := `
		SELECT id, student_id, vacancy_id, cover_letter, submitted_date, status, updated_date
		FROM applications
		WHERE id = $1
	`
	var app model.Application
	if err := ar.DB.QueryRow(query, appID).Scan(&app.ID, &app.StudentID, &app.VacancyID, &app.CoverLetter, &app.SubmittedDate, &app.Status, &app.UpdatedDate); err != nil {
		return model.Application{}, fmt.Errorf("GetApplicationByID: %v", err)
	}
	return app, nil
}

func (ar *ApplicationRepo) GetByStudentAndVacancy(studentID, vacancyID uint) (model.Application, error) {
	const query = `
        SELECT id, student_id, vacancy_id, cover_letter, submitted_date, status, updated_date
        FROM applications
        WHERE student_id = $1 AND vacancy_id = $2
        ORDER BY submitted_date DESC
        LIMIT 1
    `
	var app model.Application
	err := ar.DB.QueryRow(query, studentID, vacancyID).
		Scan(&app.ID, &app.StudentID, &app.VacancyID, &app.CoverLetter, &app.SubmittedDate, &app.Status, &app.UpdatedDate)
	if err != nil {
		return model.Application{}, err
	}
	return app, nil
}

func (ar *ApplicationRepo) GetApplicationsByVacancyID(vacancyID uint) ([]model.Application, error) {
	const query = `
      SELECT id, student_id, vacancy_id, cover_letter, submitted_date, status, updated_date
      FROM applications
      WHERE vacancy_id = $1
      ORDER BY submitted_date DESC
    `
	rows, err := ar.DB.Query(query, vacancyID)
	if err != nil {
		return nil, fmt.Errorf("GetApplicationsByVacancyID: %v", err)
	}
	defer rows.Close()

	var apps []model.Application
	for rows.Next() {
		var a model.Application
		if err := rows.Scan(&a.ID, &a.StudentID, &a.VacancyID, &a.CoverLetter, &a.SubmittedDate, &a.Status, &a.UpdatedDate); err != nil {
			return nil, fmt.Errorf("scan applications: %v", err)
		}
		apps = append(apps, a)
	}
	return apps, rows.Err()
}
