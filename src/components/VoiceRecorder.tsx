import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Pause, Square, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

interface VoiceRecorderProps {
  onTranscription?: (text: string) => void
  onRecordingComplete?: (audioBlob: Blob) => void
  onClose?: () => void
  disabled?: boolean
  className?: string
}

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
}

interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  onRecordingComplete,
  disabled = false,
  className = ''
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null
  })
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0
  })
  
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionText, setTranscriptionText] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // 清理资源
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      })
      
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordingState(prev => ({ ...prev, audioBlob }))
        onRecordingComplete?.(audioBlob)
        
        // 停止所有音轨
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }
      
      mediaRecorder.start(100) // 每100ms收集一次数据
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0
      }))
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 0.1
        }))
      }, 100)
      
    } catch (error: unknown) {
      console.error('Failed to start recording:', error)
      toast.error('无法访问麦克风，请检查权限设置')
    }
  }
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop()
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false
      }))
    }
  }
  
  // 暂停/恢复录音
  const togglePauseRecording = () => {
    if (mediaRecorderRef.current) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume()
        // 恢复计时
        timerRef.current = setInterval(() => {
          setRecordingState(prev => ({
            ...prev,
            duration: prev.duration + 0.1
          }))
        }, 100)
      } else {
        mediaRecorderRef.current.pause()
        // 暂停计时
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: !prev.isPaused
      }))
    }
  }
  
  // 播放录音
  const playRecording = () => {
    if (recordingState.audioBlob && !playbackState.isPlaying) {
      const audioUrl = URL.createObjectURL(recordingState.audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onloadedmetadata = () => {
        setPlaybackState(prev => ({
          ...prev,
          duration: audio.duration
        }))
      }
      
      audio.ontimeupdate = () => {
        setPlaybackState(prev => ({
          ...prev,
          currentTime: audio.currentTime
        }))
      }
      
      audio.onended = () => {
        setPlaybackState({
          isPlaying: false,
          currentTime: 0,
          duration: 0
        })
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.play()
      setPlaybackState(prev => ({ ...prev, isPlaying: true }))
    }
  }
  
  // 停止播放
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaybackState({
        isPlaying: false,
        currentTime: 0,
        duration: 0
      })
    }
  }
  
  // 转录音频
  const transcribeAudio = async () => {
    if (!recordingState.audioBlob) {
      toast.error('没有可转录的音频')
      return
    }
    
    setIsTranscribing(true)
    setTranscriptionText('')
    
    try {
      const formData = new FormData()
      formData.append('audio', recordingState.audioBlob, 'recording.webm')
      formData.append('language', 'zh-CN')
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/voice/speech-to-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTranscriptionText(result.text)
        onTranscription?.(result.text)
        toast.success(`转录完成 (置信度: ${(result.confidence * 100).toFixed(1)}%)`)
      } else {
        throw new Error(result.error || '转录失败')
      }
    } catch (error: unknown) {
      console.error('Transcription error:', error)
      toast.error(error.message || '语音转录失败')
    } finally {
      setIsTranscribing(false)
    }
  }
  
  // 清除录音
  const clearRecording = () => {
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null
    })
    setPlaybackState({
      isPlaying: false,
      currentTime: 0,
      duration: 0
    })
    setTranscriptionText('')
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }
  
  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className={`voice-recorder bg-white rounded-lg border p-4 ${className}`}>
      {/* 录音控制区域 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {!recordingState.isRecording ? (
            <button
              onClick={startRecording}
              disabled={disabled}
              className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-full transition-colors"
              title="开始录音"
            >
              <Mic className="w-6 h-6" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePauseRecording}
                className="flex items-center justify-center w-10 h-10 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
                title={recordingState.isPaused ? "继续录音" : "暂停录音"}
              >
                {recordingState.isPaused ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={stopRecording}
                className="flex items-center justify-center w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
                title="停止录音"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* 录音时长显示 */}
        <div className="text-sm text-gray-600">
          {recordingState.isRecording && (
            <span className={`${recordingState.isPaused ? 'text-yellow-600' : 'text-red-600'}`}>
              ● {formatTime(recordingState.duration)}
            </span>
          )}
        </div>
      </div>
      
      {/* 录音文件操作区域 */}
      {recordingState.audioBlob && !recordingState.isRecording && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {!playbackState.isPlaying ? (
                <button
                  onClick={playRecording}
                  className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                  title="播放录音"
                >
                  <Play className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={stopPlayback}
                  className="flex items-center justify-center w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
                  title="停止播放"
                >
                  <Pause className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm"
              >
                {isTranscribing ? '转录中...' : '转录文字'}
              </button>
              
              <button
                onClick={clearRecording}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                清除
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              {formatTime(recordingState.duration)}
            </div>
          </div>
          
          {/* 播放进度条 */}
          {playbackState.isPlaying && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatTime(playbackState.currentTime)}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-100"
                    style={{ 
                      width: `${playbackState.duration > 0 ? (playbackState.currentTime / playbackState.duration) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span>{formatTime(playbackState.duration)}</span>
              </div>
            </div>
          )}
          
          {/* 转录结果 */}
          {transcriptionText && (
            <div className="bg-gray-50 rounded-lg p-3 mt-3">
              <div className="flex items-start space-x-2">
                <Volume2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">{transcriptionText}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 录音状态提示 */}
      {recordingState.isRecording && (
        <div className="text-center text-sm text-gray-500 mt-2">
          {recordingState.isPaused ? '录音已暂停，点击继续' : '正在录音中...'}
        </div>
      )}
    </div>
  )
}

export default VoiceRecorder