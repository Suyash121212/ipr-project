const backend_url = import.meta.env.VITE_BACKEND_URL;
import { useEffect, useState } from "react";
import ExportButton from '../Components/ExportButton';

export default function ConsultationRequests() {
  const [consultationRequests, setConsultationRequests] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsultationRequests();
  }, []);

  const fetchConsultationRequests = async () => {
    setIsLoadingConsultations(true);
    try {
      const response = await fetch(`${backend_url}/api/consultations`);
      const result = await response.json();
      
      if (result.success) {
        setConsultationRequests(result.data);
      } else {
        console.error('Failed to fetch consultations:', result.message);
        setError(`Failed to fetch consultations: ${result.message}`);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
      setError(`Failed to fetch consultations: ${error.message}`);
    } finally {
      setIsLoadingConsultations(false);
    }
  };

  // Consultation handler functions
  const handleViewConsultation = async (consultation) => {
    // Show immediately with list data, then refresh to get uploadedFiles
    setSelectedConsultation(consultation);
    setShowConsultationModal(true);
    try {
      const res = await fetch(`${backend_url}/api/consultations/${consultation._id}`);
      const result = await res.json();
      if (result.success && result.data) {
        setSelectedConsultation(result.data);
      }
    } catch {
      /* keep cached */
    }
  };

  const handleUpdateConsultationStatus = async (id, status) => {
    try {
      const response = await fetch(`${backend_url}/api/consultations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConsultationRequests(prev => prev.map(consultation =>
          consultation._id === id ? { ...consultation, status } : consultation
        ));
        
        if (selectedConsultation && selectedConsultation._id === id) {
          setSelectedConsultation({ ...selectedConsultation, status });
        }
      } else {
        console.error('Failed to update consultation:', result.message);
        alert('Failed to update consultation status');
      }
    } catch (error) {
      console.error('Error updating consultation:', error);
      alert('Error updating consultation status');
    }
  };

  const handleDeleteConsultation = async (id) => {
    if (window.confirm('Are you sure you want to delete this consultation request?')) {
      try {
        const response = await fetch(`${backend_url}/api/consultations/${id}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          setConsultationRequests(prev => prev.filter(consultation => consultation._id !== id));
          if (selectedConsultation && selectedConsultation._id === id) {
            setSelectedConsultation(null);
            setShowConsultationModal(false);
          }
        } else {
          console.error('Failed to delete consultation:', result.message);
          alert('Failed to delete consultation');
        }
      } catch (error) {
        console.error('Error deleting consultation:', error);
        alert('Error deleting consultation');
      }
    }
  };

  const getConsultationStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300';
      case 'confirmed': return 'bg-green-500/20 text-green-300';
      case 'completed': return 'bg-blue-500/20 text-blue-300';
      case 'cancelled': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="p-6 mt-22 ml-65">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Consultation Requests</h2>
        <div className="flex space-x-2 flex-wrap gap-y-2 items-center">
          <button
            onClick={fetchConsultationRequests}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            disabled={isLoadingConsultations}
          >
            {isLoadingConsultations ? '⟳ Loading...' : '🔄 Refresh'}
          </button>
          <ExportButton type="consultations" />
          <span className="px-3 py-1 bg-blue-600 text-blue-100 rounded-full text-sm">
            Total: {consultationRequests.length}
          </span>
          <span className="px-3 py-1 bg-red-600 text-red-100 rounded-full text-sm">
            Pending: {consultationRequests.filter(req => req.status === 'pending').length}
          </span>
        </div>
      </div>

      {isLoadingConsultations ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Work Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {consultationRequests.map((consultation) => (
                  <tr key={consultation._id} className="hover:bg-slate-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {consultation.consultationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">{consultation.fullName}</div>
                      <div className="text-sm text-slate-500">{consultation.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                      {consultation.consultationType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                      {consultation.workType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(consultation.preferredDate).toLocaleDateString()}
                      <br />
                      <span className="text-slate-500">{consultation.preferredTime}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        getConsultationStatusColor(consultation.status)
                      }`}>
                        {consultation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewConsultation(consultation)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleUpdateConsultationStatus(consultation._id, 'confirmed')}
                        className="text-green-400 hover:text-green-300 mr-3"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleDeleteConsultation(consultation._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {consultationRequests.length === 0 && !isLoadingConsultations && (
            <div className="text-center py-12">
              <div className="text-slate-500 text-lg">No consultation requests found</div>
            </div>
          )}
        </div>
      )}

      {/* Consultation Detail Modal */}
      {showConsultationModal && selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Consultation Details</h3>
              <button
                onClick={() => setShowConsultationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Consultation ID</label>
                  <p className="text-white">{selectedConsultation.consultationId}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Status</label>
                  <p className={`px-2 py-1 rounded-full text-xs font-medium capitalize inline-block ${getConsultationStatusColor(selectedConsultation.status)}`}>
                    {selectedConsultation.status}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Full Name</label>
                  <p className="text-white">{selectedConsultation.fullName}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Email</label>
                  <p className="text-white">{selectedConsultation.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Phone</label>
                  <p className="text-white">{selectedConsultation.phone}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Work Type</label>
                  <p className="text-white capitalize">{selectedConsultation.workType}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Consultation Type</label>
                  <p className="text-white capitalize">{selectedConsultation.consultationType}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Preferred Date/Time</label>
                  <p className="text-white">
                    {new Date(selectedConsultation.preferredDate).toLocaleDateString()} at {selectedConsultation.preferredTime}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-slate-400 text-sm">Description</label>
                <p className="text-white bg-slate-700 p-3 rounded mt-1">{selectedConsultation.description}</p>
              </div>
              
                      {selectedConsultation.uploadedFiles && selectedConsultation.uploadedFiles.length > 0 && (
                <div>
                  <label className="text-slate-400 text-sm">Uploaded Files ({selectedConsultation.uploadedFiles.length})</label>
                  <div className="mt-1 space-y-2">
                    {selectedConsultation.uploadedFiles.map((file, index) => (
                      <div key={file._id || index} className="flex items-center justify-between bg-slate-700 p-3 rounded">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-white text-sm truncate">{file.originalName || file.fileName}</p>
                          {(file.fileSize || file.size) && (
                            <p className="text-slate-500 text-xs">
                              {(file.fileSize || file.size) < 1024 * 1024
                                ? `${((file.fileSize || file.size) / 1024).toFixed(1)} KB`
                                : `${((file.fileSize || file.size) / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                          )}
                        </div>
                        {file._id && (
                          <div className="flex gap-2 flex-shrink-0">
                            <a
                              href={`${backend_url}/api/files/view/${file._id}?isAdmin=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300 text-sm px-2 py-1 bg-green-500/10 rounded transition-colors"
                              title="View inline"
                            >
                              View
                            </a>
                            <a
                              href={`${backend_url}/api/files/download/${file._id}?isAdmin=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 bg-blue-500/20 rounded transition-colors"
                            >
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => handleUpdateConsultationStatus(selectedConsultation._id, 'confirmed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={selectedConsultation.status === 'confirmed'}
                >
                  {selectedConsultation.status === 'confirmed' ? '✓ Confirmed' : 'Confirm'}
                </button>
                <button
                  onClick={() => handleUpdateConsultationStatus(selectedConsultation._id, 'completed')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={selectedConsultation.status === 'completed'}
                >
                  {selectedConsultation.status === 'completed' ? '✓ Completed' : 'Mark Complete'}
                </button>
                <button
                  onClick={() => handleDeleteConsultation(selectedConsultation._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => window.open(`mailto:${selectedConsultation.email}?subject=Consultation Confirmation: ${selectedConsultation.consultationId}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
