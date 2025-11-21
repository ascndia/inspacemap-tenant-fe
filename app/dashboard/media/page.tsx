import { MediaLibrary } from "@/components/media/media-library";

export default function MediaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            Manage and organize your media assets
          </p>
        </div>
      </div>
      <div className="border rounded-lg bg-background">
        <MediaLibrary mode="manage" />
      </div>
    </div>
  );
}
