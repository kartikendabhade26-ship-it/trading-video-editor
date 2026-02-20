import { useState, useRef, useCallback } from 'react';

export const useVideoRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            // 1. Request user permission to capture their screen/tab
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                },
                audio: true, // Attempt to capture audio if available
            });

            // 2. Initialize MediaRecorder with prefered options (webm)
            let options = { mimeType: 'video/webm;codecs=vp9,opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm;codecs=vp8,opus' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm' };
                }
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            // 3. Set up event listeners
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                // When stopped, download the accumulated chunks
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.style.display = 'none';
                a.href = url;
                a.download = `animation_${new Date().getTime()}.webm`;
                a.click();

                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                // Stop all tracks to release the screen
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
            };

            // Handle user manually clicking "Stop sharing" from the browser's native UI
            stream.getVideoTracks()[0].onended = () => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            };

            // 4. Start recording
            mediaRecorder.start();
            setIsRecording(true);

            return true;
        } catch (err) {
            console.error("Failed to start recording:", err);
            setIsRecording(false);
            return false;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    return {
        isRecording,
        startRecording,
        stopRecording
    };
};
