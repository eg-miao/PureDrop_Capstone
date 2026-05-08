import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";
import { supabase } from "./supabase";

type UploadFileOptions = {
  bucket?: string;
  contentType?: string;
  upsert?: boolean;
  base64Data?: string;
};

const DEFAULT_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "reports";
const LOCAL_URI_PATTERN = /^(file|content|ph|assets-library):/i;
const NETWORK_FAILURE_PATTERN = /network request failed|fetch failed/i;
const CACHE_UPLOAD_DIR = "upload-cache";

type CachedUri = {
  uri: string;
  cleanup: () => Promise<void>;
};

const readArrayBufferWithXhr = (fileUri: string): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (!xhr.response) {
        reject(new Error("Selected file is unavailable. Please choose the image again."));
        return;
      }

      resolve(xhr.response as ArrayBuffer);
    };
    xhr.onerror = () => {
      reject(new Error("Unable to read the selected file from device storage."));
    };
    xhr.responseType = "arraybuffer";
    xhr.open("GET", fileUri, true);
    xhr.send(null);
  });

const copyToCacheForUpload = async (sourceUri: string): Promise<CachedUri | null> => {
  if (!LOCAL_URI_PATTERN.test(sourceUri) || !FileSystem.cacheDirectory) {
    return null;
  }

  const extensionMatch = sourceUri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : ".bin";
  const cacheDir = `${FileSystem.cacheDirectory}${CACHE_UPLOAD_DIR}`;
  const cacheUri = `${cacheDir}/upload-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;

  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  await FileSystem.copyAsync({ from: sourceUri, to: cacheUri });

  return {
    uri: cacheUri,
    cleanup: async () => {
      try {
        await FileSystem.deleteAsync(cacheUri);
      } catch {
        // Cache cleanup failure should not block report submission.
      }
    },
  };
};

const readLocalFileData = async (fileUri: string): Promise<ArrayBuffer> => {
  try {
    return await readArrayBufferWithXhr(fileUri);
  } catch (initialError) {
    const cached = await copyToCacheForUpload(fileUri);
    if (!cached) {
      throw initialError;
    }

    try {
      return await readArrayBufferWithXhr(cached.uri);
    } finally {
      await cached.cleanup();
    }
  }
};

const readFileData = async (fileUri: string) => {
  const trimmedUri = fileUri.trim();
  if (!trimmedUri) {
    throw new Error("Attachment URI is empty.");
  }

  if (LOCAL_URI_PATTERN.test(trimmedUri)) {
    return readLocalFileData(trimmedUri);
  }

  const response = await fetch(trimmedUri);
  if (!response.ok) {
    throw new Error(`File fetch failed (${response.status}).`);
  }

  return response.arrayBuffer();
};

const decodeBase64ToArrayBuffer = (base64Value: string): ArrayBuffer => {
  const normalized = base64Value.includes(",")
    ? (base64Value.split(",").pop() ?? "")
    : base64Value;

  if (!normalized) {
    throw new Error("Attachment data is empty.");
  }

  const buffer = Buffer.from(normalized, "base64");
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

export async function uploadFile(
  fileUri: string,
  destinationPath: string,
  options: UploadFileOptions = {}
) {
  const { bucket = DEFAULT_BUCKET, contentType, upsert = false, base64Data } = options;
  const fileData = base64Data ? decodeBase64ToArrayBuffer(base64Data) : await readFileData(fileUri);

  let attempts = 0;
  let lastError: unknown = null;
  while (attempts < 2) {
    attempts += 1;

    try {
      const { data, error } = await supabase.storage.from(bucket).upload(destinationPath, fileData, {
        contentType,
        upsert,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isTransient = NETWORK_FAILURE_PATTERN.test(message.toLowerCase());

      if (!isTransient || attempts >= 2) {
        break;
      }
    }
  }

  if (
    lastError instanceof Error &&
    NETWORK_FAILURE_PATTERN.test(lastError.message.toLowerCase())
  ) {
    throw new Error(
      "Upload failed due to network/device file access. Please check internet, reselect the image, and try again."
    );
  }

  throw lastError instanceof Error ? lastError : new Error("Upload failed.");
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
