export function buildPlaceholderUrl(
  id: string,
  label: string
): string {
  const params = new URLSearchParams({
    id,
    text: label,
  });
  return `/api/placeholder?${params.toString()}`;
}
