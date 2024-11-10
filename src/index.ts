import * as fs from 'fs'
import * as path from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'

type PackageJson = {
  version: string;
  [key: string]: any;
}

type GitHubContent = {
  content: string;
}

export async function run(): Promise<void> {
  try {
    const packagePath = path.join(
      process.env.GITHUB_WORKSPACE || '',
      core.getInput('path'),
      'package.json'
    )

    if (!fs.existsSync(packagePath)) {
      throw new Error(`package.json not found at ${packagePath}`)
    }

    const currentPackage: PackageJson = JSON.parse(
      fs.readFileSync(packagePath, 'utf8')
    )
    const currentVersion = currentPackage.version

    const { context } = github
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GITHUB_TOKEN is required')
    }
    const octokit = github.getOctokit(token)

    const { data: commits } = await octokit.rest.repos.listCommits({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: path.relative(process.env.GITHUB_WORKSPACE || '', packagePath),
      per_page: 2
    })

    if (commits.length < 2) {
      core.setOutput('has_changed', 'false')
      core.setOutput('old_version', currentVersion)
      core.setOutput('new_version', currentVersion)
      return
    }

    const { data: previousFile } = await octokit.rest.repos.getContent({
      owner: context.repo.owner,
      repo: context.repo.repo,
      path: path.relative(process.env.GITHUB_WORKSPACE || '', packagePath),
      ref: commits[1].sha
    }) as { data: GitHubContent }

    const previousPackage: PackageJson = JSON.parse(
      Buffer.from(previousFile.content, 'base64').toString()
    )
    const previousVersion = previousPackage.version

    const hasChanged = previousVersion !== currentVersion

    core.setOutput('has_changed', hasChanged.toString())
    core.setOutput('old_version', previousVersion)
    core.setOutput('new_version', currentVersion)

    if (hasChanged) {
      console.log(`Version changed from ${previousVersion} to ${currentVersion}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

run().then(() => {
  console.log('Version check complete')
})
