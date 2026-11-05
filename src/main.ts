import * as core from '@actions/core';
import { context } from '@actions/github';
import { createIssue, YouTrackCustomField } from './youtrack';

export async function run(): Promise<void> {
  if (context.actor !== 'dependabot[bot]') {
    core.info('Skipping: actor is not dependabot[bot]');
    return;
  }

  if (!context.payload.pull_request) {
    core.setFailed('No pull_request payload found. This action must run on a pull_request event.');
    return;
  }

  const youtrackUrl = core.getInput('youtrack-url');
  const token = core.getInput('youtrack-token');

  if (!youtrackUrl) {
    core.setFailed('Input "youtrack-url" is required but was not provided.');
    return;
  }
  if (!token) {
    core.setFailed('Input "youtrack-token" is required but was not provided.');
    return;
  }

  const projectId = core.getInput('project-id');
  const pr = context.payload.pull_request as unknown as { title: string; html_url: string };
  const summary = `Dependabot: ${pr.title}`;

  const assigneeId = core.getInput('assignee-id');
  const codebaseId = core.getInput('codebase-id');

  const customFields: YouTrackCustomField[] = [
    { $type: 'SingleEnumIssueCustomField', id: core.getInput('subproject-field-id'), value: { name: core.getInput('subproject') } },
    { $type: 'SingleEnumIssueCustomField', id: core.getInput('pr-field-id'),         value: { name: pr.html_url } },
    { $type: 'StateIssueCustomField',      id: core.getInput('stage-field-id'),       value: { name: core.getInput('stage') } },
    { $type: 'SingleEnumIssueCustomField', id: core.getInput('type-field-id'),        value: { name: core.getInput('type') } },
    { $type: 'StateIssueCustomField',      id: core.getInput('state-field-id'),       value: { name: core.getInput('state') } },
    { $type: 'SingleEnumIssueCustomField', id: core.getInput('priority-field-id'),    value: { name: core.getInput('priority') } },
    ...(assigneeId ? [{ $type: 'SingleUserIssueCustomField', id: core.getInput('assignee-field-id'), value: { login: assigneeId } } as YouTrackCustomField] : []),
    ...(codebaseId ? [{ $type: 'SingleEnumIssueCustomField', id: core.getInput('codebase-field-id'), value: { name: codebaseId } } as YouTrackCustomField] : []),
  ];

  const issue = await createIssue(youtrackUrl, token, projectId, summary, customFields);
  core.info(`Created YouTrack issue ${issue.idReadable}: ${youtrackUrl}/issue/${issue.idReadable}`);
}
