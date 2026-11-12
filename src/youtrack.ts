export interface YouTrackCustomField {
  $type: string;
  id: string;
  value: string | Record<string, string> | Record<string, string>[];
}

export interface YouTrackIssue {
  id: string;
  idReadable: string;
  summary: string;
}

export async function createIssue(
  youtrackUrl: string,
  token: string,
  projectId: string,
  summary: string,
  customFields: YouTrackCustomField[]
): Promise<YouTrackIssue> {
  const baseUrl = youtrackUrl.replace(/\/$/, '');
  const url = `${baseUrl}/api/issues?fields=id,idReadable,summary`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        summary,
        project: { id: projectId },
        customFields,
      }),
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error reaching YouTrack at ${url}: ${cause}`);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTrack API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<YouTrackIssue>;
}
