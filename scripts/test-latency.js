/**
 * Latency probing script for the Alibaba Cloud deployment.
 * Usage: node scripts/test-latency.js
 *
 * Optional environment variables:
 *   API_URL        - override default backend URL (default: http://8.148.73.181:3000/api)
 *   TEST_EMAIL     - existing user email for login test
 *   TEST_PASSWORD  - password for the login test
 */

const API_URL = process.env.API_URL || 'http://8.148.73.181:3000/api'
const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

const colorize = (text, color) => color + text + COLORS.reset

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const classifyLatency = (value) => {
  if (value < 200) return COLORS.green
  if (value < 500) return COLORS.yellow
  return COLORS.red
}

async function measureLatency(name, requestFactory, iterations = 5) {
  const samples = []
  console.log('\n' + colorize('>> ' + name, COLORS.cyan))
  console.log('-'.repeat(60))

  for (let i = 0; i < iterations; i += 1) {
    const { url, options } = requestFactory()
    const started = Date.now()

    try {
      const response = await fetch(url, options)
      const elapsed = Date.now() - started
      samples.push(elapsed)

      const statusColor = response.ok ? COLORS.green : COLORS.red
      const latencyColor = classifyLatency(elapsed)
      console.log(
        `  #${i + 1} ${colorize(`${response.status} ${response.statusText}`, statusColor)} in ${colorize(`${elapsed}ms`, latencyColor)}`
      )
    } catch (error) {
      console.log(`  #${i + 1} ${colorize('ERROR', COLORS.red)} ${error instanceof Error ? error.message : String(error)}`)
    }

    await sleep(1000)
  }

  if (samples.length > 0) {
    const average = Math.round(samples.reduce((acc, cur) => acc + cur, 0) / samples.length)
    const min = Math.min(...samples)
    const max = Math.max(...samples)

    console.log('-'.repeat(60))
    console.log(`  avg: ${colorize(`${average}ms`, classifyLatency(average))}`)
    console.log(`  min: ${colorize(`${min}ms`, COLORS.green)}`)
    console.log(`  max: ${colorize(`${max}ms`, classifyLatency(max))}`)
  }
}

async function run() {
  console.log(colorize('\nYIXIN latency benchmark (ECS/RDS)', COLORS.cyan))
  console.log('='.repeat(60))
  console.log(`Backend base URL: ${API_URL}`)

  const tests = [
    {
      name: 'Health endpoint',
      requestFactory: () => ({
        url: `${API_URL}/health`,
        options: { method: 'GET' },
      }),
    },
  ]

  if (TEST_EMAIL && TEST_PASSWORD) {
    tests.push({
      name: 'Auth login',
      requestFactory: () => ({
        url: `${API_URL}/auth/login`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        },
      }),
    })
  }

  for (const test of tests) {
    // eslint-disable-next-line no-await-in-loop
    await measureLatency(test.name, test.requestFactory)
  }

  console.log('\n' + '='.repeat(60))
  console.log(colorize('Latency guide:', COLORS.cyan))
  console.log(`  ${colorize('< 200ms', COLORS.green)}   excellent`)
  console.log(`  ${colorize('200-500ms', COLORS.yellow)} acceptable`)
  console.log(`  ${colorize('> 500ms', COLORS.red)}   investigate network or server load`)
  console.log('')
}

run().catch((error) => {
  console.error('Latency script failed:', error)
  process.exit(1)
})
