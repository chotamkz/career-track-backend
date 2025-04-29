package postgres

import (
	"database/sql"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/util"
)

type ProfileRepo struct {
	DB     *sql.DB
	Logger *util.Logger
}

func NewProfileRepo(db *sql.DB, logger *util.Logger) *ProfileRepo {
	return &ProfileRepo{DB: db, Logger: logger}
}

func (pr *ProfileRepo) CreateStudentProfile(profile *model.StudentProfile) error {
	query := `INSERT INTO student_profiles (user_id, name, education) VALUES ($1, $2, $3)`
	_, err := pr.DB.Exec(query, profile.UserID, profile.Name, profile.Education)
	if err != nil {
		pr.Logger.Errorf("Error creating student profile for user_id %d: %v", profile.UserID, err)
		return err
	}
	return nil
}

func (pr *ProfileRepo) CreateEmployerProfile(profile *model.EmployerProfile) error {
	query := `INSERT INTO employer_profiles (user_id, company_name, company_description, contact_info)
			  VALUES ($1, $2, $3, $4)`
	_, err := pr.DB.Exec(query, profile.UserID, profile.CompanyName, profile.CompanyDescription, profile.ContactInfo)
	if err != nil {
		pr.Logger.Errorf("Error creating employer profile for user_id %d: %v", profile.UserID, err)
		return err
	}
	return nil
}

func (pr *ProfileRepo) GetEmployerProfile(userID uint) (model.EmployerProfile, error) {
	var profile model.EmployerProfile
	query := `SELECT user_id, company_name, company_description, contact_info 
			  FROM employer_profiles WHERE user_id = $1`
	err := pr.DB.QueryRow(query, userID).Scan(&profile.UserID, &profile.CompanyName, &profile.CompanyDescription, &profile.ContactInfo)
	if err != nil {
		return model.EmployerProfile{}, fmt.Errorf("GetEmployerProfile: %w", err)
	}
	return profile, nil
}

func (pr *ProfileRepo) UpdateEmployerProfile(profile *model.EmployerProfile) error {
	query := `UPDATE employer_profiles 
			  SET company_name = $1, company_description = $2, contact_info = $3 
			  WHERE user_id = $4`
	res, err := pr.DB.Exec(query, profile.CompanyName, profile.CompanyDescription, profile.ContactInfo, profile.UserID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("no employer profile updated")
	}
	return nil
}

func (pr *ProfileRepo) GetStudentProfile(userID uint) (model.StudentProfile, error) {
	const q = `
      SELECT user_id, name, education,
             COALESCE(city, '') AS city,
             status,
             COALESCE(phone, '') AS phone
      FROM student_profiles
      WHERE user_id = $1
    `
	var p model.StudentProfile
	err := pr.DB.QueryRow(q, userID).
		Scan(&p.UserID, &p.Name, &p.Education, &p.City, &p.Status, &p.Phone)
	return p, err
}

func (pr *ProfileRepo) UpdateStudentProfile(p *model.StudentProfile) error {
	const q = `
      UPDATE student_profiles SET
        name = $1,
        education = $2,
        city = $3,
        status = $4,
        phone = $5
      WHERE user_id = $6
    `
	_, err := pr.DB.Exec(q,
		p.Name, p.Education, p.City, p.Status, p.Phone, p.UserID,
	)
	return err
}
