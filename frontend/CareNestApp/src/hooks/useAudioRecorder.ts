import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { ensureMicrophonePermission } from '../utils/audioPermissions';

function buildRecordPath() {
  const basePath = RNFS.CachesDirectoryPath;
  const filename = `voice-input-${Date.now()}.m4a`;
  return `${basePath}/${filename}`;
}

function normalizeRecordPath(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (Platform.OS === 'android' && path.startsWith('file://')) {
    return path.replace('file://', '');
  }
  return path;
}

export function useAudioRecorder() {
  const recorderRef = useRef(new AudioRecorderPlayer());
  const [isRecording, setIsRecording] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return null;
    }

    const granted = await ensureMicrophonePermission();
    if (!granted) {
      throw new Error('Cần cấp quyền micro để ghi âm.');
    }

    const filePath = buildRecordPath();
    const startedPath = await recorderRef.current.startRecorder(filePath);
    const resolvedPath = normalizeRecordPath(startedPath) || filePath;
    setCurrentFilePath(resolvedPath);
    setIsRecording(true);
    return resolvedPath;
  }, [isRecording]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) {
      return currentFilePath;
    }

    const stoppedPath = await recorderRef.current.stopRecorder();
    recorderRef.current.removeRecordBackListener();
    const resolvedPath = normalizeRecordPath(stoppedPath) || currentFilePath;
    setCurrentFilePath(resolvedPath || null);
    setIsRecording(false);
    return resolvedPath;
  }, [currentFilePath, isRecording]);

  useEffect(() => {
    return () => {
      if (isRecording) {
        void recorderRef.current.stopRecorder().catch(() => undefined);
      }
      recorderRef.current.removeRecordBackListener();
    };
  }, [isRecording]);

  return useMemo(
    () => ({
      isRecording,
      currentFilePath,
      startRecording,
      stopRecording,
    }),
    [currentFilePath, isRecording, startRecording, stopRecording],
  );
}
