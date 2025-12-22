import setupMiddlewares from '@/main/config/middlewares'
import setupRoutes from '@/main/config/routes'
import setupStaticFiles from '@/main/config/static-files'
import setupSwagger from '@/main/config/swagger'
import { applyApolloMiddleware } from '@/main/graphql/apollo'

import express, { Express } from 'express'
import { createServer, Server } from 'http'

export const setupApp = async (): Promise<{ app: Express; httpServer: Server }> => {
  const app = express()
  const httpServer = createServer(app)
  setupStaticFiles(app)
  setupSwagger(app)
  setupMiddlewares(app)
  setupRoutes(app)
  await applyApolloMiddleware(app, httpServer)
  return { app, httpServer }
}
