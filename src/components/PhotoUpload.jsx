import { useRef } from "react";

export default function PhotoUpload({ onPhotoSelect }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onPhotoSelect(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <button
        onClick={() => fileInputRef.current.click()}
        style={{ padding: "0.5rem", backgroundColor: "#444", color: "white", border: "none", borderRadius: "5px" }}
      >
        Upload Photo
      </button>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
