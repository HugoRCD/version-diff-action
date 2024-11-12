import * as fs from 'fs'
import * as path from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { getInput } from '@actions/core'

type PackageJson = {
  version: string;
  [key: string]: any;
}

type GitHubContent = {
  content: string;
}

type RunOptions = {
  debug?: boolean;
}

function debugLog(message: string, options?: RunOptions): void {
  if (options?.debug) {
    console.log(`[DEBUG] ${message}`)
  }
}

export async function run(options: RunOptions = {}): Promise<void> {
  try {
    const packagePath = path.join(
      process.env.GITHUB_WORKSPACE || '',
      core.getInput('path')
    )
    debugLog(`Package path: ${packagePath}`, options)

    if (!fs.existsSync(packagePath)) {
      throw new Error(`package.json not found at ${packagePath}`)
    }
    debugLog('Package.json file found', options)

    const currentPackage: PackageJson = JSON.parse(
      fs.readFileSync(packagePath, 'utf8')
    )
    const currentVersion = currentPackage.version
    debugLog(`Current version: ${currentVersion}`, options)

    const { context } = github
    const token = getInput('token')
    debugLog('GitHub token found', options)

    const octokit = github.getOctokit(token)
    debugLog(`Checking repository: ${context.repo.owner}/${context.repo.repo}`, options)

    const relativePath = path.relative(process.env.GITHUB_WORKSPACE || '', packagePath)
    debugLog(`Relative path: ${relativePath}`, options)

    const { data: commits } = await octokit.rest.repos.listCommits({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: relativePath,
      per_page: 2
    })
    debugLog(`Found ${commits.length} commits`, options)

    if (commits.length < 2) {
      debugLog('Not enough commits to compare versions', options)
      core.setOutput('has_changed', 'false')
      core.setOutput('old_version', currentVersion)
      core.setOutput('new_version', currentVersion)
      return
    }

    debugLog(`Previous commit SHA: ${commits[1].sha}`, options)

    const { data: previousFile } = await octokit.rest.repos.getContent({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: relativePath,
      ref: commits[1].sha
    }) as { data: GitHubContent }

    const previousPackage: PackageJson = JSON.parse(
      Buffer.from(previousFile.content, 'base64').toString()
    )
    const previousVersion = previousPackage.version
    debugLog(`Previous version: ${previousVersion}`, options)

    const hasChanged = previousVersion !== currentVersion
    debugLog(`Version has changed: ${hasChanged}`, options)

    core.setOutput('has_changed', hasChanged.toString())
    core.setOutput('old_version', previousVersion)
    core.setOutput('new_version', currentVersion)

    if (hasChanged) {
      console.log(`Version changed from ${previousVersion} to ${currentVersion}`)
    }
  } catch (error) {
    debugLog(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`, options)
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

const debug = core.getInput('debug') === 'true'
run({ debug }).then(() => {
  console.log('Version check complete')
})
