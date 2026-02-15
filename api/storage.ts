import { supabase } from "./supabase";

type UploadFileOptions = {
  bucket?: string;
  contentType?: string;
  upsert?: boolean;
};

const DEFAULT_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "reports";

export async function uploadFile(
  fileUri: string,
  destinationPath: string,
  options: UploadFileOptions = {}
) {
  const { bucket = DEFAULT_BUCKET, contentType, upsert = false } = options;

  const fileResponse = await fetch(fileUri);
  const fileBlob = await fileResponse.blob();

  const { data, error } = await supabase.storage.from(bucket).upload(destinationPath, fileBlob, {
    contentType,
    upsert,
  });

  if (error) {
    throw error;
  }

  return data;
}

export function getPublicFileUrl(path: string, bucket = DEFAULT_BUCKET) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeFile(path: string, bucket = DEFAULT_BUCKET) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw error;
  }
}
