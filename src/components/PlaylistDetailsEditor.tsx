import { useState } from "react";

interface PlaylistDetailsEditorProps {
  playlistId: string;
  initialName: string;
  initialDescription?: string;
  initialImage?: string;
  accessToken: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function PlaylistDetailsEditor({
  playlistId,
  initialName,
  initialDescription = "",
  initialImage,
  accessToken,
  onClose,
  onUpdate,
}: PlaylistDetailsEditorProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    initialImage,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 256KB para Spotify)
    if (file.size > 256 * 1024) {
      setError("La imagen debe ser menor a 256KB");
      return;
    }

    // Validar formato
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }

    setImage(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body: any = {
        name: name.trim(),
        description: description.trim(),
      };

      // Si hay una imagen nueva, convertirla a base64
      if (image) {
        const reader = new FileReader();
        const imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            // Extraer solo el base64 sin el prefijo "data:image/..."
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });

        body.image = imageBase64;
      }

      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/spotify/playlists/${playlistId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.success) {
        alert("✅ Playlist actualizada exitosamente!");
        onUpdate();
        onClose();
      } else {
        throw new Error(result.message || "Error al actualizar playlist");
      }
    } catch (err) {
      console.error("Error updating playlist:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar playlist",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Detalles de la Playlist</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="details-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Nombre *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Playlist"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la playlist..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Imagen de portada</label>
            <div className="image-upload">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="image-preview"
                />
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
              <p className="help-text">Máximo 256KB | Formatos: JPG, PNG</p>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #1a1a1a;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #333;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #fff;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #333;
          color: #fff;
        }

        .details-form {
          padding: 20px;
        }

        .error-message {
          background: #ff4444;
          color: #fff;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #fff;
          font-weight: 500;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: 12px;
          background: #282828;
          border: 1px solid #404040;
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-group input[type="text"]:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #1db954;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .image-upload {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .image-preview {
          width: 150px;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #404040;
        }

        .form-group input[type="file"] {
          padding: 8px;
          background: #282828;
          border: 1px solid #404040;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
        }

        .help-text {
          font-size: 0.85rem;
          color: #999;
          margin: 0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn-secondary,
        .btn-primary {
          padding: 12px 24px;
          border-radius: 24px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 1rem;
        }

        .btn-secondary {
          background: #282828;
          color: #fff;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #333;
        }

        .btn-primary {
          background: #1db954;
          color: #000;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1ed760;
          transform: scale(1.05);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled,
        input:disabled,
        textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
