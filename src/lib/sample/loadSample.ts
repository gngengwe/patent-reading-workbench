export async function loadSamplePatent(): Promise<string> {
  const response = await fetch('/sample-patent.txt');
  if (!response.ok) throw new Error('Failed to load sample patent');
  return response.text();
}
