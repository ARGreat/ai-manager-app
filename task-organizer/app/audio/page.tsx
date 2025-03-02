// filepath: /c:/SPRING2025/HackCU11/ai-manager-app/task-organizer/app/audio/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Upload, Loader2 } from "lucide-react";
import AudioRecorder from "@/components/audio-recorder";
import AudioUploader from "@/components/audio-uploader";
import Navbar from '@/components/Navbar'; // Import the Navbar component

export default function AudioPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [tasks, setTasks] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  }, []);

  const handleAudioCaptured = (blob: Blob) => {
    setAudioBlob(blob);
  };

  const handleProcessAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "inputAudio.mp3");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploadedFile`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { id, tasks } = await response.json();
        setTasks(tasks);
        router.push(`/results/${id}`);
      } else {
        throw new Error("Failed to process audio");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50"> {/* "flex min-h-screen flex-col bg-gray-50"> */}
      <Navbar /> {/* Add Navbar at the top */}
      <Card className="w-full max-w-3xl mt-8 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Audio Import</CardTitle>
          <CardDescription>
            Record a conversation where tasks are being delegated, and we'll organize them by team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="record" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="record">
                <Mic className="mr-2 h-4 w-4"/>
                Record Audio
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4"/>
                Upload Audio
              </TabsTrigger>
            </TabsList>
            <TabsContent value="record" className="mt-4">
              <AudioRecorder onAudioCaptured={handleAudioCaptured}/>
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
              <AudioUploader onAudioCaptured={handleAudioCaptured}/>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={handleProcessAudio}
            disabled={!audioBlob || isProcessing}
            className="w-full max-w-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Processing...
              </>
            ) : (
              "Process Conversation"
            )}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}