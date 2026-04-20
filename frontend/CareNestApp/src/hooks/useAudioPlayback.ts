import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

function buildPlaybackPath() {
  return `${RNFS.CachesDirectoryPath}/voice-reply-${Date.now()}.mp3`;
}

export function useAudioPlayback() {
  const playerRef = useRef(new AudioRecorderPlayer());
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastAudioPath, setLastAudioPath] = useState<string | null>(null);

  const stopPlayback = useCallback(async () => {
    if (!isPlaying) {
      return;
    }

    await playerRef.current.stopPlayer();
    playerRef.current.removePlayBackListener();
    setIsPlaying(false);
  }, [isPlaying]);

  const playBase64 = useCallback(async (audioBase64: string) => {
    if (!audioBase64.trim()) {
      throw new Error('Không có dữ liệu audio để phát.');
    }

    if (isPlaying) {
      await stopPlayback();
    }

    const audioPath = buildPlaybackPath();
    await RNFS.writeFile(audioPath, audioBase64, 'base64');
    setLastAudioPath(audioPath);

    await playerRef.current.startPlayer(audioPath);
    setIsPlaying(true);

    playerRef.current.addPlayBackListener(event => {
      if (event.duration > 0 && event.currentPosition >= event.duration) {
        void stopPlayback();
      }
    });

    return audioPath;
  }, [isPlaying, stopPlayback]);

  useEffect(() => {
    return () => {
      if (isPlaying) {
        void playerRef.current.stopPlayer().catch(() => undefined);
      }
      playerRef.current.removePlayBackListener();
    };
  }, [isPlaying]);

  return useMemo(
    () => ({
      isPlaying,
      lastAudioPath,
      playBase64,
      stopPlayback,
    }),
    [isPlaying, lastAudioPath, playBase64, stopPlayback],
  );
}
