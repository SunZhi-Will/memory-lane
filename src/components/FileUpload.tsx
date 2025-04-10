import React, { useState, useRef } from 'react';
import Button from '@/components/Button';

interface FileUploadProps {
    onUpload: (file: File) => void;
    accept?: string;
    maxSize?: number; // in MB
    error?: string;
}

export default function FileUpload({
    onUpload,
    accept = '.txt',
    maxSize = 10,
    error
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const validateFile = (file: File): boolean => {
        setUploadError('');
        setFileName('');

        // Check file type
        const fileType = file.name.split('.').pop()?.toLowerCase();
        const acceptedTypes = accept.split(',').map(type =>
            type.trim().replace('.', '').toLowerCase()
        );

        if (!acceptedTypes.includes(fileType || '')) {
            setUploadError(`檔案格式不支援，請上傳 ${accept} 格式的檔案`);
            return false;
        }

        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
            setUploadError(`檔案大小超過限制 (${maxSize}MB)`);
            return false;
        }

        setFileName(file.name);
        return true;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer?.files[0];
        if (!file) return;

        if (validateFile(file)) {
            onUpload(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (validateFile(file)) {
            onUpload(file);
        }
    };

    const handleSelectFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleReset = () => {
        setFileName('');
        setUploadError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const displayError = error || uploadError;

    return (
        <div className="w-full">
            <div
                className={`
          relative p-6 border-2 border-dashed rounded-xl transition-all duration-300
          ${isDragging
                        ? 'border-indigo-400 bg-indigo-50/80 shadow-lg'
                        : fileName
                            ? 'border-emerald-400 bg-emerald-50/50 hover:border-emerald-500'
                            : 'border-gray-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/50'
                    }
        `}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center text-center">
                    {fileName ? (
                        // 已選擇檔案狀態
                        <div className="w-full">
                            <div className="w-16 h-16 mb-4 mx-auto bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h4 className="font-medium text-gray-800 mb-2">
                                已選擇檔案
                            </h4>
                            <p className="text-emerald-600 text-sm font-medium mb-4 break-all px-4">
                                {fileName}
                            </p>
                            <div className="flex justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                >
                                    重新選擇
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // 上傳狀態
                        <>
                            <div className="w-16 h-16 mb-4 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h4 className="font-medium text-gray-800 mb-2">
                                {isDragging ? '放開以上傳檔案' : '拖放檔案至此處'}
                            </h4>
                            <p className="text-gray-500 text-sm mb-4">或</p>
                            <Button
                                variant="primary"
                                onClick={handleSelectFileClick}
                                iconLeft={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                }
                            >
                                選擇檔案
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={accept}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <p className="mt-3 text-xs text-gray-500">
                                支援的檔案格式：{accept.replace(/\./g, '')}（最大 {maxSize}MB）
                            </p>
                        </>
                    )}
                </div>
            </div>

            {displayError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg animate-fade-in">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h5 className="text-sm font-medium text-red-800 mb-1">上傳失敗</h5>
                            <p className="text-xs text-red-700">{displayError}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
