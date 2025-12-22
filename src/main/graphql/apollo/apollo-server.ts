import typeDefs from '@/main/graphql/type-defs'
import resolvers from '@/main/graphql/resolvers'
import { authDirectiveTransformer } from '@/main/graphql/directives'

import { makeExecutableSchema } from '@graphql-tools/schema'
import { ApolloServer } from '@apollo/server'
import { GraphQLError, GraphQLFormattedError } from 'graphql'
import type { BaseContext } from '@apollo/server'

interface Context extends BaseContext {
  req: any
}

const handleErrors = (formattedError: GraphQLFormattedError, error: Error & { originalError?: Error }): GraphQLFormattedError => {
  const checkError = (errorName: string): boolean => {
    return [error.name, error.originalError?.name].some(name => name === errorName)
  }

  if (checkError('UserInputError')) {
    return { ...formattedError, extensions: { ...formattedError.extensions, code: 'BAD_USER_INPUT', http: { status: 400 } } }
  } else if (checkError('AuthenticationError')) {
    return { ...formattedError, extensions: { ...formattedError.extensions, code: 'UNAUTHENTICATED', http: { status: 401 } } }
  } else if (checkError('ForbiddenError')) {
    return { ...formattedError, extensions: { ...formattedError.extensions, code: 'FORBIDDEN', http: { status: 403 } } }
  }
  return { ...formattedError, extensions: { ...formattedError.extensions, code: 'INTERNAL_SERVER_ERROR', http: { status: 500 } } }
}

let schema = makeExecutableSchema({ resolvers, typeDefs })
schema = authDirectiveTransformer(schema)

export const setupApolloServer = (): ApolloServer<Context> => new ApolloServer<Context>({
  schema,
  formatError: handleErrors
})
