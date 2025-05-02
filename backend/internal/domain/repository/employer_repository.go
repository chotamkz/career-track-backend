package repository

type EmployerRepository interface {
	GetAllCompanyNames() ([]string, error)
}
