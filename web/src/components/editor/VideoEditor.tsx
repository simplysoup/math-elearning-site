import { videoEmbedUrl } from "../lesson/videoEmbed";

interface VideoEditorProps {
  url: string;
  caption?: string;
  onChange: (data: { url: string; caption?: string }) => void;
}

const VideoEditor = ({ url, caption, onChange }: VideoEditorProps) => {
  const embed = videoEmbedUrl(url);
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        Video link (YouTube or Vimeo)
        <input
          type="url"
          value={url}
          placeholder="https://www.youtube.com/watch?v=..."
          onChange={(e) => onChange({ url: e.target.value, caption })}
          className="mt-1 w-full px-3 py-2 border border-rule rounded-sm bg-paper"
        />
      </label>
      <label className="block text-sm font-medium">
        Caption (optional)
        <input
          type="text"
          value={caption ?? ""}
          onChange={(e) => onChange({ url, caption: e.target.value })}
          className="mt-1 w-full px-3 py-2 border border-rule rounded-sm bg-paper"
        />
      </label>
      {url.trim() !== "" && !embed && (
        <p className="text-sm text-red-600">
          That link is not a YouTube or Vimeo video.
        </p>
      )}
      {embed && (
        <div className="aspect-video w-full border border-rule rounded-sm overflow-hidden bg-black">
          <iframe
            src={embed}
            title={caption || "Video preview"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

export default VideoEditor;
