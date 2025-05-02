package postgres

import (
	"database/sql"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"github.com/chotamkz/career-track-backend/internal/util"
	"strings"
)

type UserRepo struct {
	DB     *sql.DB
	Logger *util.Logger
}

func NewUserRepo(db *sql.DB, logger *util.Logger) repository.UserRepository {
	return &UserRepo{DB: db, Logger: logger}
}

func (ur *UserRepo) EnsureEmployerExists(employerID uint, companyName string) error {
	dummyEmail := generateDummyEmail(companyName)
	dummyPassword := "dummy"

	tx, err := ur.DB.Begin()
	if err != nil {
		ur.Logger.Errorf("Error starting transaction: %v", err)
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
			return
		}
	}()

	userQuery := `
        INSERT INTO users (id, email, password, user_type, created_at, updated_at)
        VALUES ($1, $2, $3, 'EMPLOYER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
    `

	_, err = tx.Exec(userQuery, employerID, dummyEmail, dummyPassword)
	if err != nil {
		ur.Logger.Errorf("Error inserting user: %v", err)
		return err
	}

	profileQuery := `
        INSERT INTO employer_profiles (user_id, company_name, company_description, contact_info)
        VALUES ($1, $2, '', '')
        ON CONFLICT (user_id) 
        DO UPDATE SET company_name = $2 WHERE employer_profiles.company_name = '' OR employer_profiles.company_name IS NULL
    `

	_, err = tx.Exec(profileQuery, employerID, companyName)
	if err != nil {
		ur.Logger.Errorf("Error inserting employer profile: %v", err)
		return err
	}

	err = tx.Commit()
	if err != nil {
		ur.Logger.Errorf("Error committing transaction: %v", err)
		return err
	}

	return nil
}

func generateDummyEmail(companyName string) string {
	processed := strings.ReplaceAll(companyName, " ", "")
	return fmt.Sprintf("%s@example.com", strings.ToLower(processed))
}

func (ur *UserRepo) CreateUser(user *model.User) error {
	query := `
		INSERT INTO users (email, password, user_type, created_at, updated_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`
	return ur.DB.QueryRow(query, user.Email, user.Password, user.UserType).Scan(&user.ID)
}

func (ur *UserRepo) GetUserByEmail(email string) (model.User, error) {
	var user model.User
	query := `
		SELECT id, email, password, user_type, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	err := ur.DB.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.Password, &user.UserType, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return model.User{}, fmt.Errorf("GetUserByEmail: %w", err)
	}
	return user, nil
}

func (ur *UserRepo) GetByID(userID uint) (model.User, error) {
	const q = `
      SELECT id, email, user_type, created_at, updated_at
      FROM users
      WHERE id = $1
    `
	var u model.User
	err := ur.DB.QueryRow(q, userID).
		Scan(&u.ID, &u.Email, &u.UserType, &u.CreatedAt, &u.UpdatedAt)
	return u, err
}
