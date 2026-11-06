import { VideoContent } from "../../types/course";
import { videoEmbedUrl } from "./videoEmbed";

interface VideoComponentProps {
  content: VideoContent;
}

export const VideoComponent = ({ content }: VideoComponentProps) => {
  const embed = videoEmbedUrl(content.data.url);

  if (!embed) {
    return (
      <div className="border border-rule rounded-sm p-4">
        <p className="text-sm">
          This video link is not supported. Use a YouTube or Vimeo link.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full border border-rule rounded-sm overflow-hidden bg-black">
        <iframe
          src={embed}
          title={content.data.caption || "Video"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {content.data.caption && (
        <p className="text-sm text-gray-600">{content.data.caption}</p>
      )}
    </div>
  );
};
