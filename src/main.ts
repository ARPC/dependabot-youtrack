import * as core from '@actions/core';
import { context } from '@actions/github';
import { createIssue, YouTrackCustomField } from './youtrack';

export async function run(): Promise<void> {
  if (context.actor !== 'dependabot[bot]') {
    core.info('Skipping: actor is not dependabot[bot]');
    return;
  }

  const youtrackUrl = core.getInput('youtrack-url');
  const token = core.getInput('youtrack-token');
  const project = core.getInput('project');
  const pr = context.payload.pull_request as unknown as { title: string; html_url: string };
  const summary = `Dependabot: ${pr.title}`;

  const customFields: YouTrackCustomField[] = [
    { $type: 'SingleEnumIssueCustomField', name: 'SubProject', value: { name: core.getInput('subproject') } },
    { $type: 'SingleEnumIssueCustomField', name: 'PR',         value: { name: pr.html_url } },
    { $type: 'StateIssueCustomField',      name: 'Stage',      value: { name: core.getInput('stage') } },
    { $type: 'SingleEnumIssueCustomField', name: 'Type',       value: { name: core.getInput('type') } },
    { $type: 'StateIssueCustomField',      name: 'State',      value: { name: core.getInput('state') } },
    { $type: 'SingleUserIssueCustomField', name: 'Assignee',   value: { login: core.getInput('assignee') } },
    { $type: 'SingleEnumIssueCustomField', name: 'Priority',   value: { name: core.getInput('priority') } },
    { $type: 'SingleEnumIssueCustomField', name: 'CodeBase',   value: { name: core.getInput('codebase') } },
  ];

  const issue = await createIssue(youtrackUrl, token, project, summary, customFields);
  core.info(`Created YouTrack issue ${issue.idReadable}: ${youtrackUrl}/issue/${issue.idReadable}`);
}
