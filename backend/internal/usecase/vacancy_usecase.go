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
	vacancyRepo repository.VacancyRepository
}

func NewVacancyUsecase(vacRepo repository.VacancyRepository) *VacancyUsecase {
	return &VacancyUsecase{
		vacancyRepo: vacRepo,
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

func GetMLRecommendations(studentSkills, mlServiceURL string) (MLResponse, error) {
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

func (vu *VacancyUsecase) GetRecommendedVacancies(studentSkills, mlServiceURL string) ([]model.VacancyMLResponse, error) {
	mlResp, err := GetMLRecommendations(studentSkills, mlServiceURL)
	if err != nil {
		return nil, err
	}

	var ids []uint
	recMap := make(map[uint]MLRecommendation)
	for _, rec := range mlResp.Recommendations {
		ids = append(ids, rec.VacancyID)
		recMap[rec.VacancyID] = rec
	}

	vacancies, err := vu.vacancyRepo.GetVacanciesByIDs(ids)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch vacancies by IDs: %v", err)
	}

	var result []model.VacancyMLResponse
	for _, v := range vacancies {
		rec, ok := recMap[v.ID]
		if !ok {
			continue
		}
		resp := model.VacancyMLResponse{
			Vacancy:       v,
			MissingSkills: rec.MissingSkills,
		}
		resp.SimilarityScore = rec.SimilarityScore
		result = append(result, resp)
	}

	return result, nil
}
