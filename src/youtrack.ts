export interface YouTrackCustomField {
  $type: string;
  name: string;
  value: Record<string, string>;
}

export interface YouTrackIssue {
  id: string;
  idReadable: string;
  summary: string;
}

export async function createIssue(
  youtrackUrl: string,
  token: string,
  project: string,
  summary: string,
  customFields: YouTrackCustomField[]
): Promise<YouTrackIssue> {
  const baseUrl = youtrackUrl.replace(/\/$/, '');
  const url = `${baseUrl}/api/issues?fields=id,idReadable,summary`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      summary,
      project: { name: project },
      customFields,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTrack API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<YouTrackIssue>;
}
