"use client";

import { useState, useEffect, useRef, FormEvent, DragEvent } from "react";
import "./gallery.css";

interface ImageMetadata {
  key: string;
  size: number;
  uploaded: string;
  contentType: string;
  customMetadata: {
    originalName?: string;
    title?: string;
    description?: string;
    uploadedAt?: string;
  };
}

export default function ImageGallery() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageMetadata | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Deployed Cloudflare Worker URL
  const API_URL = 'https://image-gallery-api.sghangaan.workers.dev';

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/images`);

      if (!response.ok) {
        throw new Error('Failed to load images');
      }

      const data = await response.json();
      setImages(data.images);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const title = titleRef.current?.value || '';
    const description = descriptionRef.current?.value || '';

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('description', description);

    setUploading(true);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload success:', data);

      // Close modal and reload images
      closeUploadModal();
      loadImages();

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setPreviewUrl("");
    if (titleRef.current) titleRef.current.value = "";
    if (descriptionRef.current) descriptionRef.current.value = "";
  };

  const showImageDetail = (key: string) => {
    const image = images.find(img => img.key === key);
    if (image) {
      setCurrentImage(image);
      setShowImageModal(true);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage(null);
  };

  const downloadImage = () => {
    if (!currentImage) return;

    const link = document.createElement('a');
    link.href = `${API_URL}/api/images/${currentImage.key}`;
    link.download = currentImage.customMetadata?.originalName || currentImage.key;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteImage = async () => {
    if (!currentImage) return;

    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/images/${currentImage.key}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      closeImageModal();
      loadImages();

    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete image');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="gallery-page">
      <div className="gallery-container-wrapper">
        {/* Header */}
        <header className="gallery-header">
          <div className="header-content">
            <h1>📸 Image Gallery</h1>
            <div className="header-badges">
              <span className="badge">Cloudflare R2</span>
              <span className="badge" id="countBadge">
                {images.length} image{images.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary">
            ➕ Upload Image
          </button>
        </header>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="modal show" onClick={(e) => {
            if (e.target === e.currentTarget) closeUploadModal();
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>Upload Image</h2>
                <button onClick={closeUploadModal} className="close-btn">&times;</button>
              </div>
              <form onSubmit={handleUpload} className="upload-form">
                <div
                  className={`file-upload-area ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    required
                    hidden
                    onChange={handleFileInputChange}
                  />
                  <div className="upload-icon">📁</div>
                  <p className="upload-text">
                    <strong>Click to upload</strong> or drag and drop<br />
                    <span className="upload-hint">PNG, JPG, GIF, WebP (max 10MB)</span>
                  </p>
                  {previewUrl && (
                    <div className="preview">
                      <img src={previewUrl} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="title">Title (optional)</label>
                  <input type="text" id="title" ref={titleRef} placeholder="Enter image title" />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description (optional)</label>
                  <textarea id="description" ref={descriptionRef} rows={3} placeholder="Enter image description" />
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={closeUploadModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading} className="btn-primary">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Image Detail Modal */}
        {showImageModal && currentImage && (
          <div className="modal show" onClick={(e) => {
            if (e.target === e.currentTarget) closeImageModal();
          }}>
            <div className="modal-content modal-large">
              <div className="modal-header">
                <h2>
                  {currentImage.customMetadata?.title || currentImage.customMetadata?.originalName || 'Image Details'}
                </h2>
                <button onClick={closeImageModal} className="close-btn">&times;</button>
              </div>
              <div className="image-detail">
                <img
                  src={`${API_URL}/api/images/${currentImage.key}`}
                  alt={currentImage.customMetadata?.title || 'Image'}
                />
                <div className="image-info">
                  <div className="info-item">
                    <strong>Title:</strong>
                    <span>{currentImage.customMetadata?.title || 'Untitled'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Description:</strong>
                    <span>{currentImage.customMetadata?.description || 'No description'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Size:</strong>
                    <span>{formatFileSize(currentImage.size)}</span>
                  </div>
                  <div className="info-item">
                    <strong>Type:</strong>
                    <span>{currentImage.contentType}</span>
                  </div>
                  <div className="info-item">
                    <strong>Uploaded:</strong>
                    <span>{new Date(currentImage.uploaded).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={downloadImage} className="btn-secondary">
                  ⬇️ Download
                </button>
                <button onClick={deleteImage} className="btn-danger">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gallery */}
        <div className="gallery-main-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🖼️</div>
              <h2>No images yet</h2>
              <p>Upload your first image to get started!</p>
              <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                Upload Image
              </button>
            </div>
          ) : (
            <div className="gallery">
              {images.map((image) => (
                <div
                  key={image.key}
                  className="gallery-item"
                  onClick={() => showImageDetail(image.key)}
                >
                  <img
                    src={`${API_URL}/api/images/${image.key}`}
                    alt={image.customMetadata?.title || 'Image'}
                    loading="lazy"
                  />
                  <div className="gallery-item-overlay">
                    <div className="gallery-item-title">
                      {image.customMetadata?.title || image.customMetadata?.originalName || 'Untitled'}
                    </div>
                    <div className="gallery-item-date">
                      {new Date(image.uploaded).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
