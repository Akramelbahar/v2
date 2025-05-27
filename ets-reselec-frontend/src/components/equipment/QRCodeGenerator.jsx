

// 11. Equipment QR Code Generator
// ets-reselec-frontend/src/components/equipment/QRCodeGenerator.jsx
import React, { useState } from 'react';
import { QrCode, Download, Share2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import Modal from '../common/Modal';
import { equipmentService } from '../../services/equipmentService';
import toast from 'react-hot-toast';

const QRCodeGenerator = ({ equipment, isOpen, onClose }) => {
  const [qrCodeData, setQrCodeData] = useState(null);

  const generateQRMutation = useMutation({
    mutationFn: () => equipmentService.generateQR(equipment.id),
    onSuccess: (data) => {
      setQrCodeData(data.data);
    },
    onError: () => {
      toast.error('Failed to generate QR code');
    }
  });

  const handleGenerate = () => {
    generateQRMutation.mutate();
  };

  const handleDownload = () => {
    if (!qrCodeData?.qrCode) return;
    
    const link = document.createElement('a');
    link.download = `${equipment.nom}-qr-code.png`;
    link.href = qrCodeData.qrCode;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share && qrCodeData?.data?.url) {
      try {
        await navigator.share({
          title: `${equipment.nom} - Equipment Info`,
          text: `View details for ${equipment.nom}`,
          url: qrCodeData.data.url
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      if (qrCodeData?.data?.url) {
        navigator.clipboard.writeText(qrCodeData.data.url);
        toast.success('URL copied to clipboard');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Equipment QR Code"
      size="md"
    >
      <div className="space-y-6">
        {/* Equipment Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">{equipment.nom}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Type: {equipment.type_equipement?.replace('_', ' ')}</p>
            <p>Brand: {equipment.marque}</p>
            <p>Model: {equipment.modele}</p>
            <p>Owner: {equipment.proprietaire?.nom_entreprise}</p>
          </div>
        </div>

        {/* QR Code Display */}
        {qrCodeData ? (
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img 
                src={qrCodeData.qrCode} 
                alt="Equipment QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Scan this code to view equipment details
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Generate a QR code for this equipment</p>
            <button
              onClick={handleGenerate}
              disabled={generateQRMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
            >
              {generateQRMutation.isPending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Generate QR Code</span>
            </button>
          </div>
        )}

        {/* Actions */}
        {qrCodeData && (
          <div className="flex justify-center space-x-3 pt-4 border-t">
            <button
              onClick={handleDownload}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={handleShare}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QRCodeGenerator;
