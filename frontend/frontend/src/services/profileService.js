import { apiClient, API_ENDPOINTS, handleApiError } from './api';

// Сервис для работы с профилем студента
export const studentProfileService = {
  // Получение профиля студента
  getProfile: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.STUDENTS.PROFILE);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Обновление профиля студента
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.STUDENTS.UPDATE, profileData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Загрузка резюме студента
  uploadResume: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`${API_ENDPOINTS.STUDENTS.PROFILE}/resume`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Получение списка сохраненных вакансий
  getSavedVacancies: async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.STUDENTS.PROFILE}/saved-vacancies`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Получение истории заявок
  getApplicationHistory: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS.GET_MY_APPLICATIONS);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Сервис для работы с профилем работодателя
export const employerProfileService = {
  // Получение профиля работодателя
  getProfile: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EMPLOYERS.PROFILE);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Обновление профиля работодателя
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.EMPLOYERS.UPDATE, profileData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Загрузка логотипа компании
  uploadLogo: async (file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await apiClient.post(`${API_ENDPOINTS.EMPLOYERS.PROFILE}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Получение активных вакансий работодателя
  getVacancies: async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.EMPLOYERS.PROFILE}/vacancies`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
}; 