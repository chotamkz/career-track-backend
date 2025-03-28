package usecase

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"io/ioutil"
	"net/http"
	"strings"
)

type MLRecommendation struct {
	VacancyID       uint     `json:"vacancy_id"`
	SimilarityScore float64  `json:"similarity_score"`
	MissingSkills   []string `json:"missing_skills"`
}

type MLResponse struct {
	Recommendations []MLRecommendation `json:"recommendations"`
}

type VacancyUsecase struct {
	vacancyRepo  repository.VacancyRepository
	mlServiceURL string
}

func NewVacancyUsecase(vacRepo repository.VacancyRepository, mlServiceURL string) *VacancyUsecase {
	return &VacancyUsecase{
		vacancyRepo:  vacRepo,
		mlServiceURL: mlServiceURL,
	}
}

func (vu *VacancyUsecase) ListVacancies() ([]model.Vacancy, error) {
	return vu.vacancyRepo.GetVacancies()
}

func (vu *VacancyUsecase) GetVacancyById(id uint) (model.Vacancy, error) {
	return vu.vacancyRepo.GetVacancyById(id)
}

func (vu *VacancyUsecase) FilterVacancies(filter model.VacancyFilter) ([]model.Vacancy, error) {
	return vu.vacancyRepo.GetFilteredVacancies(filter)
}

func (vu *VacancyUsecase) CreateVacancy(v *model.Vacancy) error {
	return vu.vacancyRepo.CreateVacancy(v)
}

func (vu *VacancyUsecase) AddSkillsToVacancy(vacancyID uint, skills []string) error {
	for _, s := range skills {
		skillName := strings.TrimSpace(s)
		if skillName == "" {
			continue
		}
		if err := vu.vacancyRepo.InsertVacancySkill(vacancyID, skillName); err != nil {
			return err
		}
	}
	return nil
}

func (vu *VacancyUsecase) GetRecommendedVacancies(filter model.VacancyFilter, mlSkills string) ([]model.VacancyMLResponse, error) {
	sqlVacancies, err := vu.vacancyRepo.GetFilteredVacancies(filter)
	if err != nil {
		return nil, fmt.Errorf("SQL filtering failed: %v", err)
	}

	if strings.TrimSpace(mlSkills) == "" {
		var result []model.VacancyMLResponse
		for _, v := range sqlVacancies {
			result = append(result, model.VacancyMLResponse{Vacancy: v})
		}
		return result, nil
	}

	mlResp, err := getMLRecommendations(mlSkills, vu.mlServiceURL)
	if err != nil {
		return nil, fmt.Errorf("ML service call failed: %v", err)
	}

	recMap := make(map[uint]MLRecommendation)
	for _, rec := range mlResp.Recommendations {
		recMap[rec.VacancyID] = rec
	}

	var result []model.VacancyMLResponse
	for _, v := range sqlVacancies {
		if rec, ok := recMap[v.ID]; ok {
			result = append(result, model.VacancyMLResponse{
				Vacancy:         v,
				SimilarityScore: rec.SimilarityScore,
				MissingSkills:   rec.MissingSkills,
			})
		}
	}

	if len(result) == 0 && len(recMap) > 0 {
		var mlIDs []uint
		for id := range recMap {
			mlIDs = append(mlIDs, id)
		}
		vacancies, err := vu.vacancyRepo.GetVacanciesByIDs(mlIDs)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch vacancies by IDs: %v", err)
		}
		for _, v := range vacancies {
			if rec, ok := recMap[v.ID]; ok {
				result = append(result, model.VacancyMLResponse{
					Vacancy:         v,
					SimilarityScore: rec.SimilarityScore,
					MissingSkills:   rec.MissingSkills,
				})
			}
		}
	}

	return result, nil
}

func getMLRecommendations(studentSkills, mlServiceURL string) (MLResponse, error) {
	payload := map[string]string{
		"student_skills": studentSkills,
	}
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return MLResponse{}, err
	}
	resp, err := http.Post(mlServiceURL+"/recommend", "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return MLResponse{}, fmt.Errorf("failed to call ML service: %v", err)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return MLResponse{}, err
	}
	var mlResp MLResponse
	if err := json.Unmarshal(body, &mlResp); err != nil {
		return MLResponse{}, fmt.Errorf("failed to unmarshal ML response: %v", err)
	}
	return mlResp, nil
}
