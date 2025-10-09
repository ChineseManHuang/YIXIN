import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw, Download } from 'lucide-react'
import { toast } from 'sonner'

interface VoicePlayerProps {
  text: string
  voice?: 'male' | 'female' | 'neutral'
  speed?: number
  language?: string
  autoPlay?: boolean
  className?: string
  onPlayStart?: () => void
  onPlayEnd?: () => void
  onError?: (error: string) => void
}

interface PlaybackState {
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  text,
  voice = 'female',
  speed = 1.0,
  language = 'zh-CN',
  autoPlay = false,
  className = '',
  onPlayStart,
  onPlayEnd,
  onError
}) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false
  })
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)
  
  // 清理资源
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!audioUrl) {
      return
    }

    return () => {
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])
  
  // 自动播放
  useEffect(() => {
    if (autoPlay && text) {
      handlePlay()
    }
  }, [autoPlay, text, handlePlay])
  
  // 生成语音
  const generateSpeech = useCallback(async (): Promise<string> => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/voice/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          voice,
          speed,
          language
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '语音合成失败')
      }
      const url = URL.createObjectURL(await response.blob())

      return url
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Audio playback failed'
      setError(errorMsg)
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false
      }))
      onError?.(errorMsg)
      toast.error(errorMsg)
    }
  }, [text, voice, speed, language, onError])
  // 播放语音
  const handlePlay = useCallback(async () => {
    if (!text.trim()) {
      toast.error('没有可播放的文本内容')
      return
    }
    
    try {
      setPlaybackState(prev => ({ ...prev, isLoading: true }))
      setError(null)
      
      // 如果已有音频URL，直接播放
      if (audioUrl && audioRef.current) {
        await audioRef.current.play()
        setPlaybackState(prev => ({ ...prev, isLoading: false }))
        return
      }
      
      // 生成新的语音
      const url = await generateSpeech()
      setAudioUrl(url)
      
      // 创建音频元素
      const audio = new Audio(url)
      audioRef.current = audio
      
      // 设置音频事件监听器
      audio.onloadedmetadata = () => {
        setPlaybackState(prev => ({
          ...prev,
          duration: audio.duration,
          isLoading: false
        }))
      }
      
      audio.ontimeupdate = () => {
        setPlaybackState(prev => ({
          ...prev,
          currentTime: audio.currentTime
        }))
      }
      
      audio.onplay = () => {
        setPlaybackState(prev => ({ ...prev, isPlaying: true }))
        onPlayStart?.()
      }
      
      audio.onpause = () => {
        setPlaybackState(prev => ({ ...prev, isPlaying: false }))
      }
      
      audio.onended = () => {
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: 0
        }))
        onPlayEnd?.()
      }
      
      audio.onerror = () => {
        const errorMsg = '音频播放失败'
        setError(errorMsg)
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: false,
          isLoading: false
        }))
        onError?.(errorMsg)
        toast.error(errorMsg)
      }
      
      // 设置音量
      audio.volume = playbackState.isMuted ? 0 : playbackState.volume
      
      // 开始播放
      await audio.play()
      
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Audio playback failed'
      setError(errorMsg)
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false
      }))
      onError?.(errorMsg)
      toast.error(errorMsg)
    }
  }, [
    text,
    audioUrl,
    playbackState.isMuted,
    playbackState.volume,
    onPlayStart,
    onPlayEnd,
    onError,
    generateSpeech
  ])
  // 暂停播放
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }
  
  // 停止播放
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0
      }))
    }
  }
  
  // 调整音量
  const handleVolumeChange = (newVolume: number) => {
    setPlaybackState(prev => ({ ...prev, volume: newVolume }))
    if (audioRef.current) {
      audioRef.current.volume = playbackState.isMuted ? 0 : newVolume
    }
  }
  
  // 切换静音
  const toggleMute = () => {
    const newMuted = !playbackState.isMuted
    setPlaybackState(prev => ({ ...prev, isMuted: newMuted }))
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : playbackState.volume
    }
  }
  
  // 跳转到指定时间
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * playbackState.duration
    
    audioRef.current.currentTime = newTime
    setPlaybackState(prev => ({ ...prev, currentTime: newTime }))
  }
  
  // 下载音频
  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `speech_${Date.now()}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('音频下载已开始')
    } else {
      toast.error('请先生成语音')
    }
  }
  
  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // 获取进度百分比
  const getProgressPercentage = (): number => {
    if (playbackState.duration === 0) return 0
    return (playbackState.currentTime / playbackState.duration) * 100
  }
  
  return (
    <div className={`voice-player bg-gray-50 rounded-lg p-3 ${className}`}>
      {/* 主控制区域 */}
      <div className="flex items-center space-x-3">
        {/* 播放/暂停按钮 */}
        <button
          onClick={playbackState.isPlaying ? handlePause : handlePlay}
          disabled={playbackState.isLoading || !text.trim()}
          className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full transition-colors flex-shrink-0"
          title={playbackState.isPlaying ? '暂停' : '播放'}
        >
          {playbackState.isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : playbackState.isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        
        {/* 进度条和时间 */}
        <div className="flex-1 min-w-0">
          {/* 进度条 */}
          <div 
            ref={progressRef}
            className="w-full bg-gray-200 rounded-full h-2 cursor-pointer mb-1"
            onClick={handleSeek}
          >
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          {/* 时间显示 */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(playbackState.currentTime)}</span>
            <span>{formatTime(playbackState.duration)}</span>
          </div>
        </div>
        
        {/* 音量控制 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title={playbackState.isMuted ? '取消静音' : '静音'}
          >
            {playbackState.isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={playbackState.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            title="音量"
          />
        </div>
        
        {/* 其他控制按钮 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleStop}
            disabled={!playbackState.isPlaying}
            className="text-gray-500 hover:text-gray-700 disabled:text-gray-300 transition-colors"
            title="停止"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDownload}
            disabled={!audioUrl}
            className="text-gray-500 hover:text-gray-700 disabled:text-gray-300 transition-colors"
            title="下载音频"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 语音设置信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <div className="flex items-center space-x-3">
          <span>语音: {voice === 'male' ? '男声' : voice === 'female' ? '女声' : '中性'}</span>
          <span>语速: {speed}x</span>
          <span>语言: {language}</span>
        </div>
        
        {error && (
          <span className="text-red-500 text-xs">{error}</span>
        )}
      </div>
      
      {/* 文本预览 */}
      {text && (
        <div className="mt-2 p-2 bg-white rounded border text-sm text-gray-700 max-h-20 overflow-y-auto">
          {text}
        </div>
      )}
    </div>
  )
}

export default VoicePlayer
