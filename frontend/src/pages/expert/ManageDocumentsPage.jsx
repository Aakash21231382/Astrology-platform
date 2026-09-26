import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { IoDocumentTextOutline, IoCloudUploadOutline, IoTrashOutline, IoCheckmarkCircle, IoEyeOutline } from 'react-icons/io5';
import { uploadService, expertService } from '../../services/api';
import { toast } from 'react-toastify';

export default function ManageDocumentsPage() {
  const { profile, refreshProfile } = useOutletContext();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState(() => {
    if (!profile?.documentUrls) return [];
    try {
      const parsed = JSON.parse(profile.documentUrls);
      return Array.isArray(parsed) ? parsed : [profile.documentUrls];
    } catch (e) {
      return profile.documentUrls ? [profile.documentUrls] : [];
    }
  });
  const [docName, setDocName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadService.uploadFile(file);
      const url = typeof res === 'string' ? res : (res?.url || res?.data?.url || res?.data?.data?.url);
      if (url) {
        const newDoc = {
          name: docName || file.name || 'Certification Document',
          url,
          uploadedAt: new Date().toISOString()
        };
        const updated = [...documents, newDoc];
        setDocuments(updated);
        setDocName('');
        await expertService.updateDocuments({ documents: updated });
        toast.success('Document uploaded and saved to verification files!');
        if (refreshProfile) refreshProfile();
      }
    } catch (err) {
      toast.error('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (index) => {
    const updated = documents.filter((_, i) => i !== index);
    setDocuments(updated);
    try {
      await expertService.updateDocuments({ documents: updated });
      toast.info('Document removed');
      if (refreshProfile) refreshProfile();
    } catch (err) {
      toast.error('Failed to update documents');
    }
  };

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoDocumentTextOutline style={{ color: '#800000', fontSize: '24px' }} />
              Manage Verification Documents
            </h2>
            <p className="expert-card-desc">
              Upload your certified credentials, astrology degrees, and government ID for platform verification.
            </p>
          </div>
        </div>

        {/* Upload Box */}
        <div style={{ background: '#fffef9', border: '2px dashed #c9bea5', borderRadius: '14px', padding: '32px 20px', textAlign: 'center', margin: '14px 0 24px 0' }}>
          <IoCloudUploadOutline style={{ fontSize: '48px', color: '#FF6B00', marginBottom: '8px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#800000', margin: '0 0 6px 0' }}>
            Upload Certificate or Identity Proof
          </h3>
          <p style={{ fontSize: '13px', color: '#7a6b58', margin: '0 0 16px 0' }}>
            Supported formats: PDF, JPG, PNG (Max 10MB)
          </p>

          <div style={{ maxWidth: '380px', margin: '0 auto 16px auto' }}>
            <input
              type="text"
              placeholder="Enter document title"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              className="expert-form-input"
              style={{ textAlign: 'center' }}
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,image/*"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="btn-expert-primary"
          >
            {uploading ? 'Uploading Document...' : 'Select File to Upload'}
          </button>
        </div>

        {/* Uploaded Documents List */}
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#800000', margin: '0 0 14px 0' }}>
          Uploaded Credentials ({documents.length})
        </h3>

        {documents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {documents.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', background: '#ffffff', border: '1px solid #E2E8F0',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IoCheckmarkCircle style={{ color: '#FF6B00', fontSize: '22px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#800000' }}>
                      {typeof doc === 'string' ? `Document #${idx + 1}` : (doc.name || `Document #${idx + 1}`)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7a6b58' }}>
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Verified Attachment'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={typeof doc === 'string' ? doc : doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-expert-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <IoEyeOutline /> View
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    style={{ background: 'transparent', border: 'none', color: '#800000', cursor: 'pointer', padding: '6px', fontSize: '18px', opacity: 0.7 }}
                    title="Delete document"
                  >
                    <IoTrashOutline />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#7a6b58', fontSize: '13px' }}>No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
