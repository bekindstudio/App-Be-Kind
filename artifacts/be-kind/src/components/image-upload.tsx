import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Immagine" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Seleziona un file immagine valido");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("L'immagine non può superare i 10MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const { uploadURL, objectPath } = await customFetch<{ uploadURL: string; objectPath: string }>(
        "/api/storage/uploads/request-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type,
          }),
        }
      );

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload al server fallito");
      }

      const serveUrl = `/api${objectPath}`;
      onChange(serveUrl);
    } catch (err: any) {
      setError("Errore nel caricamento. Riprova.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      {value ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted border border-border">
          <img
            src={value}
            alt="Anteprima"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <span className="text-sm text-muted-foreground">Caricamento...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Clicca per caricare un'immagine</span>
              <span className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP — max 10MB</span>
            </>
          )}
        </label>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="...oppure incolla un URL"
        className="w-full bg-muted/50 border border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
