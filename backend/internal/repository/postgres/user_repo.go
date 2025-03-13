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

	query := `
		INSERT INTO users (id, name, email, password, user_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'EMPLOYER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO NOTHING
	`

	_, err := ur.DB.Exec(query, employerID, companyName, dummyEmail, dummyPassword)
	if err != nil {
		ur.Logger.Errorf("Error in EnsureEmployerExists: %v", err)
	}
	return err
}

func generateDummyEmail(companyName string) string {
	processed := strings.ReplaceAll(companyName, " ", "")
	return fmt.Sprintf("%s@example.com", strings.ToLower(processed))
}

func (ur *UserRepo) CreateUser(user *model.User) error {
	query := `
		INSERT INTO users (name, email, password, user_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`
	return ur.DB.QueryRow(query, user.Name, user.Email, user.Password, user.UserType).Scan(&user.ID)
}

func (ur *UserRepo) GetUserByEmail(email string) (model.User, error) {
	var user model.User
	query := `
		SELECT id, name, email, password, user_type, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	err := ur.DB.QueryRow(query, email).Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.UserType, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return model.User{}, fmt.Errorf("GetUserByEmail: %w", err)
	}
	return user, nil
}
