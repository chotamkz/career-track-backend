import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmployerVacancyForm from './EmployerVacancyForm';

const EmployerDashboard = () => {
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [isCreateVacancyModalOpen, setIsCreateVacancyModalOpen] = useState(false);
  const [isEditVacancyModalOpen, setIsEditVacancyModalOpen] = useState(false);

  const handleCreateVacancy = () => {
    setIsCreateVacancyModalOpen(true);
  };

  const handleEditVacancy = (vacancy) => {
    setSelectedVacancy(vacancy);
    setIsEditVacancyModalOpen(true);
  };

  const handleVacancySaved = (savedVacancy) => {
    fetchVacancies();
    toast.success('Вакансия успешно сохранена!');
  };

  const handleCloseVacancyForm = () => {
    setIsCreateVacancyModalOpen(false);
    setIsEditVacancyModalOpen(false);
    setSelectedVacancy(null);
  };

  const renderVacancyCard = (vacancy) => {
    return (
      <div className="vacancy-card" key={vacancy.id}>
        <h3>{vacancy.title}</h3>
        <div className="vacancy-details">
          <p><strong>Местоположение:</strong> {vacancy.location || 'Не указано'}</p>
          <p><strong>Зарплата:</strong> {renderSalary(vacancy)}</p>
          <p><strong>Опыт:</strong> {vacancy.experience || 'Не указан'}</p>
          <p><strong>График:</strong> {vacancy.work_schedule || 'Не указан'}</p>
        </div>
        <div className="vacancy-actions">
          <button 
            className="edit-btn"
            onClick={() => handleEditVacancy(vacancy)}
          >
            Редактировать
          </button>
          <button 
            className="delete-btn"
            onClick={() => handleDeleteVacancy(vacancy.id)}
          >
            Удалить
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="employer-dashboard">
      {isCreateVacancyModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseVacancyForm}>&times;</span>
            <EmployerVacancyForm
              onClose={handleCloseVacancyForm}
              onSave={handleVacancySaved}
            />
          </div>
        </div>
      )}
      
      {isEditVacancyModalOpen && selectedVacancy && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseVacancyForm}>&times;</span>
            <EmployerVacancyForm
              vacancyId={selectedVacancy.id}
              onClose={handleCloseVacancyForm}
              onSave={handleVacancySaved}
            />
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default EmployerDashboard; 