/**
 * Enhanced Document Upload Component
 * Integrates the Intelligent Document Understanding (IDU) System
 * with premium UI and advanced document processing
 */

import React, { useState, useCallback } from 'react';
import { IntelligentDocumentProcessor, ProcessedDocument } from '../../services/IntelligentDocumentProcessor';
import { DocumentIntelligencePanel } from './DocumentIntelligencePanel';

interface EnhancedDocumentUploadProps {
  onDocumentProcessed?: (document: ProcessedDocument, file: File) => void;
  onError?: (error: Error) => void;
}

export const EnhancedDocumentUpload: React.FC<EnhancedDocumentUploadProps> = ({
  onDocumentProcessed,
  onError
}) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      const errorMsg = 'Please upload a PDF file. Other formats are not yet supported.';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = 'File is too large. Maximum size is 50MB.';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    setError(null);
    setProcessing(true);
    setProgress(0);
    setCurrentFile(file.name);

    try {
      // Initialize processor
      const processor = IntelligentDocumentProcessor.getInstance();

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Process document with IDU system
      const processed = await processor.processDocument(file);

      clearInterval(progressInterval);
      setProgress(100);

      // Store result
      setProcessedDocument(processed);

      // Notify parent
      if (onDocumentProcessed) {
        onDocumentProcessed(processed, file);
      }

      console.log('✅ Document processed successfully:', processed);

    } catch (err: any) {
      console.error('❌ Document processing error:', err);
      const errorMsg = err.message || 'Failed to process document';
      setError(errorMsg);
      if (onError) onError(err);
    } finally {
      setProcessing(false);
    }
  }, [onDocumentProcessed, onError]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a synthetic event for handleFileSelect
      const syntheticEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;

      handleFileSelect(syntheticEvent);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!processedDocument && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center
            transition-all duration-300
            ${processing
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-gray-600 hover:border-purple-500 hover:bg-purple-500/5'
            }
          `}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={processing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="file-upload"
          />

          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              {processing ? (
                <>
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <div className="text-white font-semibold text-lg">
                    Processing Document...
                  </div>
                  {currentFile && (
                    <div className="text-gray-400 text-sm">{currentFile}</div>
                  )}
                  <div className="w-full max-w-md">
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-gray-400 text-xs mt-2">{progress}%</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white text-xl font-semibold">
                      Upload Research Document
                    </h3>
                    <p className="text-gray-400 text-sm max-w-md">
                      Drag and drop your PDF here, or click to browse
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      PDF Only
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Max 50MB
                    </span>
                  </div>
                </>
              )}
            </div>
          </label>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-red-400 font-semibold mb-1">Upload Error</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Document Intelligence Panel */}
      {processedDocument && (
        <>
          <DocumentIntelligencePanel
            document={processedDocument}
            onClose={() => {
              setProcessedDocument(null);
              setCurrentFile(null);
              setProgress(0);
            }}
          />

          {/* Upload Another Button */}
          <div className="text-center">
            <button
              onClick={() => {
                setProcessedDocument(null);
                setCurrentFile(null);
                setProgress(0);
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Upload Another Document
            </button>
          </div>
        </>
      )}

      {/* Features Info (shown when no document) */}
      {!processedDocument && !processing && (
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <FeatureCard
            icon="🎯"
            title="Structural Analysis"
            description="Automatically identifies document structure, sections, and hierarchy"
          />
          <FeatureCard
            icon="🔍"
            title="Entity Recognition"
            description="Extracts citations, authors, keywords, and validates references"
          />
          <FeatureCard
            icon="✨"
            title="Quality Assessment"
            description="Evaluates scientific rigor, readability, and completeness"
          />
          <FeatureCard
            icon="🧠"
            title="Semantic Understanding"
            description="Identifies research type, methodology, findings, and limitations"
          />
          <FeatureCard
            icon="📊"
            title="Statistical Analysis"
            description="Calculates word density, citation metrics, and section balance"
          />
          <FeatureCard
            icon="🚀"
            title="Lightning Fast"
            description="Processes documents in seconds with advanced algorithms"
          />
        </div>
      )}
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description
}) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
    <div className="text-3xl mb-2">{icon}</div>
    <h4 className="text-white font-semibold mb-1">{title}</h4>
    <p className="text-gray-400 text-xs">{description}</p>
  </div>
);

export default EnhancedDocumentUpload;
