import { Elysia } from 'elysia'
import { listStandardsByDocType } from './standards.service'

export const standardsController = new Elysia({ prefix: '/api/standards' })
  .get('/:docType', async ({ params }) => {
    const { docType } = params
    const standards = await listStandardsByDocType(docType)
    return {
      standards: standards.map(s => ({
        dayAge: s.dayAge,
        standardBwG: Number(s.standardBwG),
        standardFcr: s.standardFcr ? Number(s.standardFcr) : null,
      })),
    }
  })