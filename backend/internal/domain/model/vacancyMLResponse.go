package model

type VacancyMLResponse struct {
	Vacancy
	SimilarityScore float64  `json:"similarity_score,omitempty" db:"-"`
	MissingSkills   []string `json:"missing_skills"`
}
