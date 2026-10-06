import { createIssue, YouTrackCustomField } from '../youtrack';

const URL = 'https://youtrack.example.com';
const TOKEN = 'perm-token-abc';
const PROJECT = 'TMT Development';
const SUMMARY = 'Dependabot: bump lodash from 4.17.20 to 4.17.21';
const FIELDS: YouTrackCustomField[] = [
  { $type: 'SingleEnumIssueCustomField', name: 'SubProject', value: { name: 'Licensing Manager' } },
  { $type: 'StateIssueCustomField', name: 'State', value: { name: 'Active' } },
];

describe('createIssue', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('POSTs to /api/issues with the correct query string', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1-1', idReadable: 'TMT-1', summary: SUMMARY }),
    });

    await createIssue(URL, TOKEN, PROJECT, SUMMARY, FIELDS);

    expect(global.fetch).toHaveBeenCalledWith(
      `${URL}/api/issues?fields=id,idReadable,summary`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('sends Authorization: Bearer header', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1-1', idReadable: 'TMT-1', summary: SUMMARY }),
    });

    await createIssue(URL, TOKEN, PROJECT, SUMMARY, FIELDS);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${TOKEN}`);
  });

  it('sends project as { name } object, not a plain string', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1-1', idReadable: 'TMT-1', summary: SUMMARY }),
    });

    await createIssue(URL, TOKEN, PROJECT, SUMMARY, FIELDS);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.project).toEqual({ name: PROJECT });
  });

  it('includes customFields in the request body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1-1', idReadable: 'TMT-1', summary: SUMMARY }),
    });

    await createIssue(URL, TOKEN, PROJECT, SUMMARY, FIELDS);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.customFields).toEqual(FIELDS);
  });

  it('returns the created issue object', async () => {
    const issue = { id: '1-42', idReadable: 'TMT-42', summary: SUMMARY };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => issue,
    });

    const result = await createIssue(URL, TOKEN, PROJECT, SUMMARY, FIELDS);

    expect(result).toEqual(issue);
  });

  it('throws with status and body on 4xx', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden: invalid token',
    });

    await expect(createIssue(URL, TOKEN, PROJECT, SUMMARY, FIELDS)).rejects.toThrow(
      'YouTrack API error 403: Forbidden: invalid token'
    );
  });

  it('throws with status and body on 5xx', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(createIssue(URL, TOKEN, PROJECT, SUMMARY, FIELDS)).rejects.toThrow(
      'YouTrack API error 500: Internal Server Error'
    );
  });
});
