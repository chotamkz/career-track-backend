package usecase

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/chotamkz/career-track-backend/internal/domain/model"
	"github.com/chotamkz/career-track-backend/internal/domain/repository"
	"github.com/patrickmn/go-cache"
	"io/ioutil"
	"net/http"
	"strings"
	"time"
)

type MLRecommendation struct {
	VacancyID           uint     `json:"vacancy_id"`
	SimilarityScore     float64  `json:"similarity_score"`
	MatchPercentage     int      `json:"match_percentage"`
	MatchingSkills      []string `json:"matching_skills"`
	MissingSkills       []string `json:"missing_skills"`
	SkillsMatched       int      `json:"skills_matched"`
	TotalSkillsRequired int      `json:"total_skills_required"`
}

type MLResponse struct {
	Recommendations []MLRecommendation `json:"recommendations"`
}

type VacancyUsecase struct {
	vacancyRepo  repository.VacancyRepository
	mlServiceURL string
	countCache   *cache.Cache
}

func NewVacancyUsecase(vacRepo repository.VacancyRepository, mlServiceURL string) *VacancyUsecase {
	c := cache.New(3*time.Minute, 5*time.Minute)
	return &VacancyUsecase{
		vacancyRepo:  vacRepo,
		mlServiceURL: mlServiceURL,
		countCache:   c,
	}
}

func (vu *VacancyUsecase) ListVacancies(page, size int) ([]model.Vacancy, int, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 5
	}
	offset := (page - 1) * size

	var total int
	if x, found := vu.countCache.Get("vacancyTotalCount"); found {
		total = x.(int)
	} else {
		cnt, err := vu.vacancyRepo.CountVacancies()
		if err != nil {
			return nil, 0, fmt.Errorf("cannot count vacancies: %v", err)
		}
		total = cnt
		vu.countCache.Set("vacancyTotalCount", total, cache.DefaultExpiration)
	}

	if size == 0 {
		return nil, total, nil
	}

	vacs, err := vu.vacancyRepo.GetVacancies(size, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("cannot list vacancies: %v", err)
	}
	return vacs, total, nil
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
	mlResp, err := getMLRecommendations(mlSkills, vu.mlServiceURL)
	if err != nil {
		return nil, fmt.Errorf("ML service call failed: %v", err)
	}

	var mlIDs []uint
	recMap := make(map[uint]MLRecommendation)
	for _, rec := range mlResp.Recommendations {
		mlIDs = append(mlIDs, rec.VacancyID)
		recMap[rec.VacancyID] = rec
	}

	vacancies, err := vu.vacancyRepo.GetVacanciesByIDs(mlIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch vacancies by IDs: %v", err)
	}

	lcKeywords := strings.ToLower(filter.Keywords)
	lcRegion := strings.ToLower(filter.Region)
	lcExperience := strings.ToLower(filter.Experience)
	lcSchedule := strings.ToLower(filter.Schedule)

	var filteredVacancies []model.Vacancy
	for _, v := range vacancies {
		lcTitle := strings.ToLower(v.Title)
		lcDesc := strings.ToLower(v.Description)
		lcLocation := strings.ToLower(v.Location)
		lcVacExperience := strings.ToLower(v.Experience)
		lcVacSchedule := strings.ToLower(v.WorkSchedule)

		if lcKeywords != "" && !strings.Contains(lcTitle, lcKeywords) && !strings.Contains(lcDesc, lcKeywords) {
			continue
		}
		if lcRegion != "" && !strings.Contains(lcLocation, lcRegion) {
			continue
		}
		if lcExperience != "" && !strings.Contains(lcVacExperience, lcExperience) {
			continue
		}
		if filter.SalaryFrom > 0 && v.SalaryFrom < filter.SalaryFrom {
			continue
		}
		if lcSchedule != "" && !strings.Contains(lcVacSchedule, lcSchedule) {
			continue
		}
		filteredVacancies = append(filteredVacancies, v)
	}

	var result []model.VacancyMLResponse
	for _, v := range filteredVacancies {
		if rec, ok := recMap[v.ID]; ok {
			result = append(result, model.VacancyMLResponse{
				Vacancy:             v,
				SimilarityScore:     rec.SimilarityScore,
				MatchPercentage:     rec.MatchPercentage,
				MatchingSkills:      rec.MatchingSkills,
				MissingSkills:       rec.MissingSkills,
				SkillsMatched:       rec.SkillsMatched,
				TotalSkillsRequired: rec.TotalSkillsRequired,
			})
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
