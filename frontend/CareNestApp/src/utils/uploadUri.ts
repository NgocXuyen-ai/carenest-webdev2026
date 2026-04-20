export function normalizeUploadUri(uri: string): string {
  if (!uri) {
    return uri;
  }

  if (
    uri.startsWith('file://')
    || uri.startsWith('content://')
    || uri.startsWith('ph://')
    || uri.startsWith('assets-library://')
  ) {
    return uri;
  }

  return `file://${uri}`;
}