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
  },
  APPLICATIONS: {
    GET_MY_APPLICATIONS: '/applications/me',
  },
  VACANCIES: {
    GET_ALL: '/vacancies',
    SEARCH: '/vacancies/search',
    CREATE: '/vacancies',
    UPDATE: (id) => `/vacancies/${id}`,
    DELETE: (id) => `/vacancies/${id}`,
    GET_BY_ID: (id) => `/vacancies/${id}`,
    APPLY: (id) => `/vacancies/${id}/apply`,
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
      // Затем делаем реальный запрос к API
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS.GET_MY_APPLICATIONS);
      return response.data;
    } catch (error) {
      console.error('Error in getMyApplications:', error);
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