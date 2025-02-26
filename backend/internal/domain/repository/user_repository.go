package repository

type UserRepository interface {
	EnsureEmployerExists(employerID uint, companyName string) error
}
