import dotenv from 'dotenv'

dotenv.config()

const args = process.argv.slice(2)
const targetFlagIndex = args.findIndex((arg) => arg === '--target' || arg === '-t')
const rawTarget = targetFlagIndex >= 0 ? args[targetFlagIndex + 1] : undefined
const target = (rawTarget ?? 'all').toLowerCase()

type DeployTarget = 'backend' | 'frontend'
const validTargets: Array<DeployTarget | 'all'> = ['backend', 'frontend', 'all']

if (!validTargets.includes(target as DeployTarget | 'all')) {
  console.error(`? Unknown deploy target: ${rawTarget}`)
  process.exit(1)
}

const hooks: Array<{ name: DeployTarget; url?: string | null }> = [
  { name: 'backend', url: process.env.BACKEND_DEPLOY_HOOK_URL },
  { name: 'frontend', url: process.env.FRONTEND_DEPLOY_HOOK_URL },
]

const selectedHooks = target === 'all'
  ? hooks
  : hooks.filter((hook) => hook.name === target)

const triggerDeploy = async (name: DeployTarget, url: string) => {
  console.info(`?? Triggering ${name} deploy...`)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ triggeredAt: new Date().toISOString() }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Deploy hook responded with ${response.status}: ${body}`)
  }

  console.info(`? ${name} deploy hook triggered successfully.`)
}

const main = async () => {
  const tasks = selectedHooks.map(async ({ name, url }) => {
    if (!url) {
      console.warn(`??  Skipping ${name} deploy: hook URL not configured.`)
      return
    }

    try {
      await triggerDeploy(name, url)
    } catch (error) {
      console.error(`? Deployment trigger failed for ${name}:`, error)
      throw error
    }
  })

  try {
    await Promise.all(tasks)
  } catch {
    process.exit(1)
  }
}

main()
