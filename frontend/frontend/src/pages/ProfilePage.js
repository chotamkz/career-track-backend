import React from "react";
import "./ProfilePage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";

function ProfilePage() {
  return (
    <div className="ProfilePage">
      <div className="Navbar">
        <NavigationBar />
      </div>
      <div className="profile-container">
        <div className="card history-card">
          <h3>История откликов</h3>
        </div>
        <div className="card recommendations-card">
          <h3>Рекомендации</h3>
        </div>
      </div>
        <FooterComp />
    </div>
  );
}

export default ProfilePage;
// function ProfilePage() {
//   const [profile, setProfile] = useState({
//     name: "Имя Фамилия",
//     city: "Город",
//   });
  
//   const [isEditing, setIsEditing] = useState(false);
  
//   const [formData, setFormData] = useState({
//     name: profile.name,
//     city: profile.city,
//   });

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleEditClick = () => {
//     if (isEditing) {
//       setProfile({
//         name: formData.name,
//         city: formData.city,
//       });
//     }
//     setIsEditing(!isEditing);
//   };

//   const handleCancel = () => {
//     setFormData({
//       name: profile.name,
//       city: profile.city,
//     });
//     setIsEditing(false);
//   };

//   return (
//     <div className="ProfilePage">
//       <div className="Navbar">
//         <NavigationBar />
//       </div>
//       <div className="profile-container">
//         <div className="card profile-card">
//           <div className="profile-info">
//             {isEditing ? (
//               <>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   className="profile-input"
//                 />
//                 <input
//                   type="text"
//                   name="city"
//                   value={formData.city}
//                   onChange={handleInputChange}
//                   className="profile-input"
//                 />
//               </>
//             ) : (
//               <>
//                 <h2 className="profile-name">{profile.name}</h2>
//                 <p className="profile-city">{profile.city}</p>
//               </>
//             )}
//             <div className="button-group">
//               <button 
//                 className="edit-button" 
//                 onClick={handleEditClick}
//               >
//                 {isEditing ? "Сохранить" : "Редактировать"}
//               </button>
//               {isEditing && (
//                 <button 
//                   className="cancel-button" 
//                   onClick={handleCancel}
//                 >
//                   Отмена
//                 </button>
//               )}
//             </div>
//           </div>
//           <div className="profile-avatar"></div>
//         </div>
//         <div className="card resume-card">
//           <p className="upload-text">Загрузите свой резюме</p>
//           <div className="file-formats">
//             <span className="file-box">PDF</span>
//             <span className="file-box">DOCX</span>
//             <span className="file-box">TXT</span>
//             <span id="sizebox" className="size-box">{">"} 10 MB</span>
//           </div>
//         </div>
//         <div className="card history-card">
//           <h3>История откликов</h3>
//         </div>
//         <div className="card recommendations-card">
//           <h3>Рекомендации</h3>
//         </div>
//       </div>
//       <div className="FooterSection">
//         <FooterComp />
//       </div>
//     </div>
//   );
// }

// export default ProfilePage;