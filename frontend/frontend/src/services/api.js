import axios from 'axios';

// Базовый URL для API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';
console.log("API URL:", BASE_URL);

// Создаем экземпляр axios с базовым URL
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик запросов для добавления токена и логирования
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов для обработки ошибок и логирования
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.status}]`, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      
      // Если запрос был к API заявок и вернулся 404, преобразуем это в пустой массив заявок
      if (error.response.status === 404 && 
         (error.config.url.includes('applications') || error.config.url.includes('заявки'))) {
        console.log('Обработка случая отсутствия заявок как пустого массива');
        return Promise.resolve({ 
          data: { applications: [] },
          status: 200
        });
      }
      
      // Если запрос был к API вакансий работодателя и вернулся 404, преобразуем это в пустой массив вакансий
      if (error.response.status === 404 && 
         (error.config.url.includes('employers/me/vacancies'))) {
        console.log('Обработка случая отсутствия вакансий работодателя как пустого массива');
        return Promise.resolve({ 
          data: { vacancies: [] },
          status: 200
        });
      }
    }
    return Promise.reject(error);
  }
);

// Определение API эндпоинтов в соответствии с бэкендом
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER_STUDENT: '/auth/register/student',
    REGISTER_EMPLOYER: '/auth/register/employer',
    LOGIN: '/auth/login',
  },
  STUDENTS: {
    PROFILE: '/students/me',
    UPDATE: '/students/me',
  },
  EMPLOYERS: {
    PROFILE: '/employers/me',
    UPDATE: '/employers/me',
    VACANCIES: '/employers/me/vacancies',
    GET_ALL_APPLICATIONS: '/employers/me/applications',
  },
  APPLICATIONS: {
    GET_MY_APPLICATIONS: '/applications/me',
    GET_VACANCY_APPLICATIONS: (vacancyId) => `/vacancies/${vacancyId}/applications`,
    UPDATE_STATUS: (vacancyId, applicationId) => `/vacancies/${vacancyId}/applications/${applicationId}`,
  },
  VACANCIES: {
    GET_ALL: '/vacancies',
    SEARCH: '/vacancies/search',
    CREATE: '/vacancies',
    UPDATE: (id) => `/vacancies/${id}`,
    DELETE: (id) => `/vacancies/${id}`,
    GET_BY_ID: (id) => `/vacancies/${id}`,
    APPLY: (id) => `/vacancies/${id}/apply`,
    GET_REGIONS: '/vacancies/regions',
  },
  HACKATHONS: {
    GET_ALL: '/hackathons',
    CREATE: '/hackathons',
    UPDATE: (id) => `/hackathons/${id}`,
    DELETE: (id) => `/hackathons/${id}`,
    GET_BY_ID: (id) => `/hackathons/${id}`,
  },
};

// Сервисные функции для работы с вакансиями
export const vacancyService = {
  getAllVacancies: async (page = 1, size = 5) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.VACANCIES.GET_ALL}?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  /**
   * Получить список всех доступных регионов для фильтрации вакансий
   * @returns {Promise<Array<string>>} Массив регионов
   */
  getRegions: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.VACANCIES.GET_REGIONS);
      return response.data.regions || [];
    } catch (error) {
      console.error('Error fetching regions:', error);
      return handleApiError(error);
    }
  },
  
  searchVacancies: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (!params.page) params.page = 1;
      if (!params.size) params.size = 5;
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const response = await apiClient.get(`${API_ENDPOINTS.VACANCIES.SEARCH}?${queryParams}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getVacancyById: async (id) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.VACANCIES.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  applyToVacancy: async (id, coverLetter) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VACANCIES.APPLY(id), { coverLetter });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Создать новую вакансию
   * @param {Object} vacancyData - Данные вакансии
   * @param {string} vacancyData.title - Название вакансии
   * @param {string} vacancyData.description - Описание вакансии
   * @param {string} vacancyData.requirements - Требования к кандидатам
   * @param {string} vacancyData.location - Местоположение работы
   * @param {number} [vacancyData.salary_from] - Минимальная зарплата
   * @param {number} [vacancyData.salary_to] - Максимальная зарплата
   * @param {string} [vacancyData.salary_currency] - Валюта зарплаты (напр., "KZT")
   * @param {boolean} [vacancyData.salary_gross] - Зарплата указана до вычета налогов
   * @param {string} [vacancyData.vacancy_url] - URL вакансии
   * @param {string} [vacancyData.work_schedule] - График работы
   * @param {string} [vacancyData.experience] - Требуемый опыт работы
   * @param {string[]} [vacancyData.skills] - Массив требуемых навыков
   * @returns {Promise<Object>} Созданная вакансия
   */
  createVacancy: async (vacancyData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VACANCIES.CREATE, vacancyData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Обновить существующую вакансию
   * @param {string} id - Идентификатор вакансии
   * @param {Object} vacancyData - Обновленные данные вакансии
   * @returns {Promise<Object>} Обновленная вакансия
   */
  updateVacancy: async (id, vacancyData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.VACANCIES.UPDATE(id), vacancyData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Удалить вакансию
   * @param {string} id - Идентификатор вакансии
   * @returns {Promise<Object>} Результат удаления с информацией о статусе
   * 
   * Возможные коды ответов:
   * - 204 No Content — успешно удалено
   * - 403 Forbidden — вакансия не принадлежит этому работодателю
   * - 400 Bad Request — некорректный id
   * - 401 Unauthorized — не передан или невалиден токен
   */
  deleteVacancy: async (id) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.VACANCIES.DELETE(id));
      return { 
        success: true, 
        status: response.status,
        message: 'Вакансия успешно удалена'
      };
    } catch (error) {
      // Обработка конкретных статус-кодов ошибок
      if (error.response) {
        const status = error.response.status;
        let errorMessage = '';
        
        switch(status) {
          case 400:
            errorMessage = 'Некорректный идентификатор вакансии';
            break;
          case 401:
            errorMessage = 'Необходима авторизация. Возможно, срок действия вашей сессии истек';
            break;
          case 403:
            errorMessage = 'У вас нет прав на удаление этой вакансии';
            break;
          default:
            errorMessage = error.response.data?.message || 'Ошибка при удалении вакансии';
        }
        
        return { 
          success: false, 
          status: status, 
          error: errorMessage 
        };
      }
      
      return handleApiError(error);
    }
  }
};

// Сервисные функции для работы с хакатонами
export const hackathonService = {
  getAllHackathons: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HACKATHONS.GET_ALL);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getHackathonById: async (id) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HACKATHONS.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Сервисные функции для работы с заявками студента
export const applicationService = {
  getMyApplications: async () => {
    try {
      // Делаем запрос к API
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS.GET_MY_APPLICATIONS);
      
      // Если ответ пустой, но успешный - значит заявок нет
      if (response.status === 200 && 
          (!response.data || 
           (Array.isArray(response.data) && response.data.length === 0) ||
           (response.data && response.data.applications && Array.isArray(response.data.applications) && response.data.applications.length === 0))) {
        return { applications: [] };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getMyApplications:', error);
      
      // Если ошибка 404, значит заявок нет
      if (error.response && error.response.status === 404) {
        return { applications: [] };
      }
      
      // Обрабатываем другие ошибки
      return handleApiError(error);
    }
  },
  
  getVacancyApplications: async (vacancyId) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS.GET_VACANCY_APPLICATIONS(vacancyId));
      return response.data;
    } catch (error) {
      console.error('Error in getVacancyApplications:', error);
      return handleApiError(error);
    }
  },
  
  /**
   * Получить заявки на указанную вакансию
   * @param {string} vacancyId Идентификатор вакансии
   * @returns {Promise<Array>} Массив заявок
   */
  getApplicationsForVacancy: async (vacancyId) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.VACANCIES}/${vacancyId}/applications`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Обновить статус заявки
   * @param {string} applicationId Идентификатор заявки
   * @param {string} newStatus Новый статус заявки ('APPLIED', 'CV_SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_EXTENDED', 'ACCEPTED', 'REJECTED')
   * @returns {Promise<Object>} Обновленная заявка
   */
  updateApplicationStatus: async (vacancyId, applicationId, newStatus) => {
    try {
      const response = await apiClient.patch(
        `/vacancies/applications/${applicationId}`,
        { newStatus }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Сервисные функции для работы с вакансиями работодателя
export const employerVacanciesService = {
  getMyVacancies: async (page = 0, size = 5, search = '') => {
    try {
      const params = new URLSearchParams();
      
      if (page > 0) {
        params.append('page', page);
      }
      
      params.append('size', size);
      
      if (search) {
        params.append('search', search);
      }
      
      const url = `${API_ENDPOINTS.EMPLOYERS.VACANCIES}${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      // Если ошибка 404, считаем что вакансий нет
      if (error.response && error.response.status === 404) {
        return { vacancies: [], totalCount: 0, totalPages: 0 };
      }
      
      return handleApiError(error);
    }
  },
  
  deleteVacancy: async (id) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.VACANCIES.DELETE(id));
      return { 
        success: true, 
        status: response.status,
        message: 'Вакансия успешно удалена'
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Функция для обработки ошибок API
export const handleApiError = (error) => {
  if (error.response) {
    // Сервер вернул ошибку с статус-кодом
    console.error('API Error:', error.response.data);
    return { error: error.response.data.message || 'Ошибка сервера', status: error.response.status };
  } else if (error.request) {
    // Запрос был сделан, но ответ не получен
    console.error('No response received:', error.request);
    return { error: 'Нет ответа от сервера' };
  } else {
    // Произошла ошибка при настройке запроса
    console.error('Request error:', error.message);
    return { error: 'Ошибка при выполнении запроса' };
  }
}; 