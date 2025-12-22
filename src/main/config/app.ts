import setupMiddlewares from '@/main/config/middlewares'
import setupRoutes from '@/main/config/routes'
import setupStaticFiles from '@/main/config/static-files'
import setupSwagger from '@/main/config/swagger'
import { setupApolloServer } from '@/main/graphql/apollo'

import { expressMiddleware } from '@apollo/server/express4'
import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

const graphqlStatusMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send
  res.send = function (body: any) {
    if (typeof body === 'string') {
      try {
        const parsedBody = JSON.parse(body)
        if (parsedBody.errors && parsedBody.errors.length > 0) {
          const firstError = parsedBody.errors[0]
          const status = firstError.extensions?.http?.status
          if (status) {
            res.status(status)
          }
        }
      } catch (e) {}
    }
    return originalSend.call(this, body)
  }
  next()
}

export const setupApp = async (): Promise<Express> => {
  const app = express()
  setupStaticFiles(app)
  setupSwagger(app)
  setupMiddlewares(app)
  setupRoutes(app)
  const server = setupApolloServer()
  await server.start()
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    graphqlStatusMiddleware,
    expressMiddleware(server, {
      context: async ({ req }) => ({ req })
    }) as any
  )
  return app
}
