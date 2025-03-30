package model

type VacancyMLResponse struct {
	Vacancy
	SimilarityScore     float64  `json:"similarity_score,omitempty" db:"-"`
	MatchPercentage     int      `json:"match_percentage,omitempty" db:"-"`
	MatchingSkills      []string `json:"matching_skills,omitempty" db:"-"`
	MissingSkills       []string `json:"missing_skills,omitempty" db:"-"`
	SkillsMatched       int      `json:"skills_matched,omitempty" db:"-"`
	TotalSkillsRequired int      `json:"total_skills_required,omitempty" db:"-"`
}
