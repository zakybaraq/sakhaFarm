import { config } from 'dotenv'
import path from 'path'

// Load environment variables from server/.env before any tests run
config({ path: path.resolve(__dirname, '../server/.env') })
