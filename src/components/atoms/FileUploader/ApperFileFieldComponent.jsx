import { useState, useEffect, useRef, useMemo } from 'react';

const ApperFileFieldComponent = ({ elementId, config }) => {
  // State for UI-driven values
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Refs for tracking lifecycle and preventing memory leaks
  const mountedRef = useRef(false);
  const elementIdRef = useRef(elementId);
  const existingFilesRef = useRef([]);

  // Update elementIdRef when elementId changes
  useEffect(() => {
    elementIdRef.current = elementId;
  }, [elementId]);

  // Memoized existingFiles to prevent re-renders and detect actual changes
  const memoizedExistingFiles = useMemo(() => {
    const existingFiles = config.existingFiles || [];
    
    // Return empty array if existingFiles is non-existent
    if (!existingFiles || existingFiles.length === 0) {
      return [];
    }

    // Detect actual changes by checking length and first file's ID/id
    const currentLength = existingFilesRef.current.length;
    const newLength = existingFiles.length;
    
    if (currentLength !== newLength) {
      return existingFiles;
    }

    if (existingFiles.length > 0 && existingFilesRef.current.length > 0) {
      const currentFirstId = existingFilesRef.current[0]?.Id || existingFilesRef.current[0]?.id;
      const newFirstId = existingFiles[0]?.Id || existingFiles[0]?.id;
      
      if (currentFirstId !== newFirstId) {
        return existingFiles;
      }
    }

    return existingFilesRef.current;
  }, [config.existingFiles]);

  // Initial Mount Effect
  useEffect(() => {
    let cleanup = false;

    const initializeSDK = async () => {
      try {
        // Initialize ApperSDK: 50 attempts × 100ms = 5 seconds total wait time
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts && !window.ApperSDK) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.ApperSDK) {
          throw new Error('ApperSDK not loaded. Please ensure the SDK script is included before this component.');
        }

        if (cleanup) return;

        const { ApperFileUploader } = window.ApperSDK;
        elementIdRef.current = `file-uploader-${elementId}`;

        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: memoizedExistingFiles
        });

        if (!cleanup) {
          mountedRef.current = true;
          setIsReady(true);
          setError(null);
        }
      } catch (error) {
        if (!cleanup) {
          setError(error.message);
          setIsReady(false);
        }
      }
    };

    initializeSDK();

    // Cleanup on component destruction
    return () => {
      cleanup = true;
      try {
        if (window.ApperSDK && mountedRef.current) {
          const { ApperFileUploader } = window.ApperSDK;
          ApperFileUploader.FileField.unmount(elementIdRef.current);
        }
        mountedRef.current = false;
        setIsReady(false);
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [elementId, config.fieldKey, config.tableName, config.apperProjectId, config.apperPublicKey]);

  // File Update Effect
  useEffect(() => {
    if (!isReady || !window.ApperSDK || !config.fieldKey) {
      return;
    }

    // Deep equality check with JSON.stringify
    const currentFiles = JSON.stringify(existingFilesRef.current);
    const newFiles = JSON.stringify(memoizedExistingFiles);

    if (currentFiles === newFiles) {
      return;
    }

    const updateFiles = async () => {
      try {
        const { ApperFileUploader } = window.ApperSDK;
        let filesToUpdate = memoizedExistingFiles;

        // Format detection: check for .Id vs .id property
        if (filesToUpdate.length > 0) {
          const firstFile = filesToUpdate[0];
          const hasApiFormat = firstFile.hasOwnProperty('Id');
          const hasUiFormat = firstFile.hasOwnProperty('id');

          // Convert format if needed using toUIFormat()
          if (hasApiFormat && !hasUiFormat) {
            filesToUpdate = ApperFileUploader.toUIFormat(filesToUpdate);
          }
        }

        // Conditional: updateFiles if length > 0, clearField if empty
        if (filesToUpdate.length > 0) {
          await ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
        } else {
          await ApperFileUploader.FileField.clearField(config.fieldKey);
        }

        existingFilesRef.current = memoizedExistingFiles;
      } catch (error) {
        setError(error.message);
      }
    };

    updateFiles();
  }, [memoizedExistingFiles, isReady, config.fieldKey]);

  // Error UI: Show if error state exists
  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="text-red-800 font-medium">File Upload Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="file-upload-container">
      {/* Main container: Always render with unique ID */}
      <div id={`file-uploader-${elementId}`} className="min-h-[100px]">
        {/* Loading UI: Show when !isReady */}
        {!isReady && (
          <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
              <div className="text-sm text-gray-500">Initializing file uploader...</div>
            </div>
          </div>
        )}
        {/* Mounted: SDK takes over container when ready */}
      </div>
    </div>
  );
};

export default ApperFileFieldComponent;