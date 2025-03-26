package model

type VacancyMLResponse struct {
	Vacancy
	MissingSkills []string `json:"missing_skills"`
}
