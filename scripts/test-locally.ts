import { run } from '../src'

process.env.GITHUB_WORKSPACE = process.cwd()

run().catch(console.error)
