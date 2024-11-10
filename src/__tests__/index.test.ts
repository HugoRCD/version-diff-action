import { expect, test, describe, mock } from 'bun:test'
import * as core from '@actions/core'

mock.module('@actions/core', () => ({
  getInput: mock(() => './'),
  setOutput: mock(() => {}),
  setFailed: mock(() => {})
}))

mock.module('@actions/github', () => ({
  context: {
    repo: {
      owner: 'HugoRCD',
      repo: 'version-diff-action',
    }
  },
  getOctokit: mock(() => ({
    rest: {
      repos: {
        listCommits: mock(() => ({
          data: [
            { sha: 'current-sha' },
            { sha: 'previous-sha' }
          ]
        })),
        getContent: mock(() => ({
          data: {
            content: Buffer.from(JSON.stringify({ version: '1.0.0' })).toString('base64')
          }
        }))
      }
    }
  }))
}))

describe('Version Diff Action', () => {
  test('detects version change', async () => {
    // Setup
    const mockPackageJson = {
      version: '1.0.1'
    }

    mock.module('fs', () => ({
      existsSync: mock(() => true),
      readFileSync: mock(() => JSON.stringify(mockPackageJson))
    }))

    const { run } = await import('../index')

    await run({ debug: true })

    expect(core.setOutput).toHaveBeenCalledWith('has_changed', 'true')
    expect(core.setOutput).toHaveBeenCalledWith('old_version', '1.0.0')
    expect(core.setOutput).toHaveBeenCalledWith('new_version', '1.0.1')
  })
})
