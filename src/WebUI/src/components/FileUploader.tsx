import { useRef, useState } from 'react';

interface FileUploaderProps {
  onFileLoad: (path: string) => void;
}

export const FileUploader = ({ onFileLoad }: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type !== 'application/json') {
      alert('Please upload a JSON file');
      return;
    }
    
    setSelectedFile(file);
    
    // Create a local URL for the file
    const fileUrl = URL.createObjectURL(file);
    onFileLoad(fileUrl);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="text-xl font-bold mb-4">Load Git Stats Data</h2>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".json"
          onChange={handleChange}
        />
        
        <p className="mb-2">
          {selectedFile 
            ? `Selected file: ${selectedFile.name}`
            : 'Drag and drop your GitStats JSON file here'
          }
        </p>
        
        <button 
          onClick={openFileDialog}
          className="btn btn-primary mt-2"
        >
          {selectedFile ? 'Choose Another File' : 'Browse Files'}
        </button>
      </div>
    </div>
  );
};