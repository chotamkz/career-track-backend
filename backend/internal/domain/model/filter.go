package model

type VacancyFilter struct {
	Keywords   string  `json:"keywords"`
	Region     string  `json:"region"`
	Experience string  `json:"experience"`
	SalaryFrom float64 `json:"salary_from"`
	Schedule   string  `json:"schedule"`
}
