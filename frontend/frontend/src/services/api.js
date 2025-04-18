import axios from 'axios';

// Базовый URL для API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

// Создаем экземпляр axios с базовым URL
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик запросов для добавления токена
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
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
  VACANCIES: {
    GET_ALL: '/vacancies',
    SEARCH: '/vacancies/search',
    CREATE: '/vacancies',
    UPDATE: (id) => `/vacancies/${id}`,
    DELETE: (id) => `/vacancies/${id}`,
    GET_BY_ID: (id) => `/vacancies/${id}`,
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