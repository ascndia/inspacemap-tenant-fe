import { MediaLibrary } from "@/components/media/media-library"

export default function MediaPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold md:text-2xl">Media Library</h1>
      </div>
      <div className="flex-1 min-h-0 border rounded-lg p-4 bg-background">
        <MediaLibrary mode="manage" />
      </div>
    </div>
  )
}
