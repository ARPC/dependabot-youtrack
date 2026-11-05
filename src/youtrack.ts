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

async function resolveProjectId(
  baseUrl: string,
  token: string,
  shortName: string
): Promise<string> {
  const url = `${baseUrl}/api/admin/projects?fields=id,shortName&query=${encodeURIComponent(shortName)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error reaching YouTrack at ${url}: ${cause}`);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTrack API error ${response.status}: ${body}`);
  }

  const projects = (await response.json()) as Array<{ id: string; shortName: string }>;
  const match = projects.find(
    p => p.shortName.toLowerCase() === shortName.toLowerCase()
  );
  if (!match) {
    throw new Error(`YouTrack project with short name "${shortName}" not found`);
  }
  return match.id;
}

export async function createIssue(
  youtrackUrl: string,
  token: string,
  project: string,
  summary: string,
  customFields: YouTrackCustomField[]
): Promise<YouTrackIssue> {
  const baseUrl = youtrackUrl.replace(/\/$/, '');
  const projectId = await resolveProjectId(baseUrl, token, project);

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
