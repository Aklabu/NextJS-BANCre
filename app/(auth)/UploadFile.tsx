'use client'
import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import Button from '@/components/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

const UploadFile = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { signUpData, signup, loading } = useAuth();
  const router = useRouter();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['jpg', 'png', 'svg', 'zip', 'pdf'].includes(ext || '');
    });
    setFiles(prev => [...prev, ...droppedFiles].slice(0, 5));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['jpg', 'png', 'svg', 'zip', 'pdf'].includes(ext || '');
      });
      setFiles(prev => [...prev, ...selectedFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (files.length > 0) {
      const updatedSignupData = { ...(signUpData || {}), media_files: files };
      signup(updatedSignupData);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-full lg:w-1/2 bg-white flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <Link href="/">
                <Image
                  src={"/logo/BANCre.png"}
                  alt={'logo'}
                  width={150}
                  height={50}
                  className='hidden lg:flex'
                />
              </Link>
            </div>
            <h2 className="text-3xl font-bold mb-2">Registration</h2>
            <p className="text-gray-600 mb-6">
              {signUpData?.customer_type === 'Lender' 
                ? `As a ${signUpData.customer_type}, please upload your verification documents to complete your registration.`
                : "Let's get you all set up so you can access your account."}
            </p>
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Media Upload</h3>
                  <p className="text-sm text-gray-600">Add your documents here, and you can upload up to 5 files max</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload size={24} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-gray-700 mb-1 text-sm">Drag your file(s) to start uploading</p>
                <p className="text-gray-500 text-sm mb-3">OR</p>
                <label className="inline-block">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.png,.svg,.zip,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="px-5 py-2 border border-blue-600 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-50 inline-block text-sm">
                    Browse files
                  </span>
                </label>
              </div>

              <p className="text-sm text-gray-500 mt-3">Only support .jpg, .png, .svg, .pdf and .zip files</p>

              {files.length > 0 && (
                <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleComplete}
              type="button"
              isDisabled={loading || files.length === 0}
              text={loading ? "Registering..." : "Register"}
              className="button-primary w-full h-12 mb-2"
            />
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/signin" className="text-red-500 cursor-pointer hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative bg-gray-900">
        <button className="absolute top-8 right-8 text-white flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors z-10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Support
        </button>
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop"
          alt="Background"
          fill
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Smarter decisions, faster closings.</h2>
          <p className="text-lg max-w-2xl">
            Review standardized loan packages, analyze instantly, and close deals with transparency and speed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadFile;