import { useState } from 'react';
import { useAddVideo } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ExternalBlob } from '../../backend';

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VideoUploadDialog({ open, onOpenChange }: VideoUploadDialogProps) {
  const addVideo = useAddVideo();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const arrayBuffer = await videoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const metadata = {
        id: `video_${Date.now()}`,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        blob,
      };

      await addVideo.mutateAsync(metadata);
      
      setFormData({ title: '', category: '', description: '' });
      setVideoFile(null);
      setUploadProgress(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Workout Video</DialogTitle>
          <DialogDescription>Add a new video to the library for members to view</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Video Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              placeholder="e.g., Cardio, Strength, Yoga"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Video File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                required
              />
            </div>
            {videoFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !videoFile} className="flex-1">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
