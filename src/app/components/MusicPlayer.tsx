import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, MonitorSpeaker } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface MusicPlayerProps {
  currentSong: any;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  progress: number;
  volume: number;
  setVolume: (volume: number) => void;
}

export function MusicPlayer({ currentSong, isPlaying, setIsPlaying, progress, volume, setVolume }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [actualProgress, setActualProgress] = useState(0);
  const [duration, setDuration] = useState('0:30'); // Spotify previews are 30s

  useEffect(() => {
    console.log('MusicPlayer: Song changed:', currentSong?.title, 'URL:', currentSong?.previewUrl);
    if (audioRef.current && currentSong?.previewUrl) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error('Playback failed:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    } else if (!currentSong?.previewUrl && isPlaying) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setActualProgress(prog || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setActualProgress(0);
  };

  const displayTrack = currentSong || {
    title: 'AuraBeat Radio Inactiva',
    artist: 'Haz el Check-in para comenzar',
    duration: '0:00',
    artwork: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=100&h=100&fit=crop',
  };

  return (
    <div className="w-full flex items-center justify-between">
      <audio 
        ref={audioRef} 
        src={currentSong?.previewUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      
      {/* Left: Track Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        <div className="relative w-14 h-14 flex-shrink-0 group">
          <img
            src={displayTrack.artwork}
            alt={displayTrack.title}
            className="w-full h-full rounded-md object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm hover:underline cursor-pointer truncate">{displayTrack.title}</h4>
          <p className="text-[#A1A1AA] text-xs hover:underline cursor-pointer truncate">{displayTrack.artist}</p>
        </div>
      </div>

      {/* Center: Controls & Progress */}
      <div className="flex-1 max-w-2xl flex flex-col items-center justify-center px-4">
        {/* Controls */}
        <div className="flex items-center gap-6 mb-2">
          <button className="text-[#A1A1AA] hover:text-white transition-colors">
            <Shuffle className="w-4 h-4" />
          </button>
          <button className="text-[#A1A1AA] hover:text-white transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!currentSong}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-1" />
            )}
          </button>

          <button className="text-[#A1A1AA] hover:text-white transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="text-[#A1A1AA] hover:text-white transition-colors">
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-[11px] text-[#A1A1AA] font-mono w-8 text-right">0:00</span>
          <div className="h-1 flex-1 rounded-full bg-[#27272A] group relative cursor-pointer">
            <motion.div
              className="h-full bg-cyan-400 group-hover:bg-cyan-300 rounded-full"
              style={{ width: `${actualProgress || progress}%` }}
            />
          </div>
          <span className="text-[11px] text-[#A1A1AA] font-mono w-8 text-left">{currentSong?.previewUrl ? duration : displayTrack.duration}</span>
        </div>
      </div>

      {/* Right: Extra Controls (Volume, Devices) */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px]">
        <button className="text-[#A1A1AA] hover:text-white transition-colors">
          <MonitorSpeaker className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 group w-24">
          <Volume2 className="w-4 h-4 text-[#A1A1AA] group-hover:text-white transition-colors" />
          <div className="h-1 flex-1 rounded-full bg-[#27272A] cursor-pointer">
            <div className="h-full w-1/2 bg-[#A1A1AA] group-hover:bg-cyan-400 rounded-full" />
          </div>
        </div>
      </div>

    </div>
  );
}
