import { useState, useRef, useCallback } from 'react';

export function useVideoRecorder(elementId: string) {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const startRecording = useCallback(async () => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            // Need a bit of a hack to record a standard HTML div. 
            // The cleanest completely local way without sending to a server is capturing the stream if it's a Canvas, 
            // but since we are using React/DOM/Framer, we need the `getDisplayMedia` API (Screen sharing).
            // We will ask the user to select the "Browser Tab" to record.
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "browser",
                    frameRate: 60,
                },
                audio: false,
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `trade-animation-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
            };

            mediaRecorder.start();
            setIsRecording(true);

        } catch (err) {
            console.error("Error starting recording:", err);
            setIsRecording(false);
        }
    }, [elementId]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    return { isRecording, startRecording, stopRecording };
}
