
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

async function globalSetup(config) {

  const result = dotenv.config()
  if (result.error) {
    // There will be no .env file during CI
    console.log(result.error.message)
  }
}

export default globalSetup;