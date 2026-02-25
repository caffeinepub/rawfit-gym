import { useState } from 'react';
import { useGetAllVideos, useAddVideo } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Video, Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import VideoUploadDialog from './VideoUploadDialog';
import type { VideoMetadata } from '../../backend';

export default function VideoLibraryTab() {
  const { data: videos, isLoading } = useGetAllVideos();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);

  const filteredVideos = videos?.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVideoClick = (video: VideoMetadata) => {
    setSelectedVideo(video);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Video Library</h2>
          <p className="text-muted-foreground">Upload and manage workout reference videos</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search videos by title, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVideos && filteredVideos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleVideoClick(video)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-950 rounded-full p-2">
                      <Video className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                      <CardDescription className="text-xs">
                        <Badge variant="secondary" className="mt-1">{video.category}</Badge>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <video
                    src={video.blob.getDirectURL()}
                    className="w-full h-full object-cover rounded-lg"
                    controls
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No videos found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Upload your first workout video'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <VideoUploadDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
