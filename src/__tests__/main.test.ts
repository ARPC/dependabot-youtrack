jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  context: {
    actor: 'dependabot[bot]',
    payload: {
      pull_request: {
        title: 'bump lodash from 4.17.20 to 4.17.21',
        html_url: 'https://github.com/org/repo/pull/42',
        number: 42,
      },
    },
  },
}));
jest.mock('../youtrack');

import * as core from '@actions/core';
import { createIssue } from '../youtrack';
import { run } from '../main';

const mockCore = core as jest.Mocked<typeof core>;
const mockCreateIssue = createIssue as jest.MockedFunction<typeof createIssue>;

const PR_TITLE = 'bump lodash from 4.17.20 to 4.17.21';
const PR_HTML_URL = 'https://github.com/org/repo/pull/42';
const YOUTRACK_URL = 'https://youtrack.example.com';

const DEFAULT_INPUTS: Record<string, string> = {
  'youtrack-url': YOUTRACK_URL,
  'youtrack-token': 'perm-token-123',
  project: 'TMT Development',
  subproject: 'Licensing Manager',
  stage: 'In Progress',
  type: 'Bug',
  state: 'Active',
  assignee: 'jimmy.bosse',
  priority: 'Normal',
  codebase: 'No code base',
};

function githubContext() {
  return jest.requireMock('@actions/github').context;
}

describe('run()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCore.getInput.mockImplementation((name: string) => DEFAULT_INPUTS[name] ?? '');
    githubContext().actor = 'dependabot[bot]';
    githubContext().payload.pull_request = {
      title: PR_TITLE,
      html_url: PR_HTML_URL,
      number: 42,
    };
    mockCreateIssue.mockResolvedValue({
      id: '1-42',
      idReadable: 'TMT-42',
      summary: `Dependabot: ${PR_TITLE}`,
    });
  });

  it('logs skip message and does not call createIssue when actor is not dependabot[bot]', async () => {
    githubContext().actor = 'octocat';
    await run();
    expect(mockCore.info).toHaveBeenCalledWith('Skipping: actor is not dependabot[bot]');
    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  it('does not skip when actor is exactly "dependabot[bot]"', async () => {
    githubContext().actor = 'dependabot[bot]';
    await run();
    expect(mockCreateIssue).toHaveBeenCalledTimes(1);
  });

  it('sets summary to "Dependabot: {PR title}" with exact prefix', async () => {
    await run();
    const [, , , summary] = mockCreateIssue.mock.calls[0];
    expect(summary).toBe(`Dependabot: ${PR_TITLE}`);
  });

  it('uses html_url (not api url) as the PR custom field value', async () => {
    await run();
    const customFields = mockCreateIssue.mock.calls[0][4];
    const prField = customFields.find(f => f.name === 'PR');
    expect(prField?.value).toEqual({ name: PR_HTML_URL });
  });

  it('passes youtrack-url and youtrack-token as first two args to createIssue', async () => {
    await run();
    const [youtrackUrl, token] = mockCreateIssue.mock.calls[0];
    expect(youtrackUrl).toBe(YOUTRACK_URL);
    expect(token).toBe('perm-token-123');
  });

  it('logs the created issue idReadable after success', async () => {
    await run();
    expect(mockCore.info).toHaveBeenCalledWith(expect.stringContaining('TMT-42'));
  });

  it('calls setFailed with a clear message when pull_request payload is absent', async () => {
    githubContext().payload.pull_request = undefined;
    await run();
    expect(mockCore.setFailed).toHaveBeenCalledWith(
      'No pull_request payload found. This action must run on a pull_request event.'
    );
    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  it('omits Assignee and CodeBase from customFields when inputs are empty', async () => {
    mockCore.getInput.mockImplementation((name: string) =>
      ({ ...DEFAULT_INPUTS, assignee: '', codebase: '' } as Record<string, string>)[name] ?? ''
    );
    await run();
    const customFields = mockCreateIssue.mock.calls[0][4];
    expect(customFields.find(f => f.name === 'Assignee')).toBeUndefined();
    expect(customFields.find(f => f.name === 'CodeBase')).toBeUndefined();
  });

  it('throws on YouTrack API error so the entry point can call setFailed', async () => {
    mockCreateIssue.mockRejectedValueOnce(new Error('YouTrack API error 403: Forbidden'));
    await expect(run()).rejects.toThrow('YouTrack API error 403: Forbidden');
  });
});
