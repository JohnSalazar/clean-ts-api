import { Controller } from '@/presentation/protocols'
import { GraphQLError } from 'graphql'

class UserInputError extends GraphQLError {
  constructor (message: string) {
    super(message, {
      extensions: { code: 'BAD_USER_INPUT' }
    })
    this.name = 'UserInputError'
  }
}

class AuthenticationError extends GraphQLError {
  constructor (message: string) {
    super(message, {
      extensions: { code: 'UNAUTHENTICATED' }
    })
    this.name = 'AuthenticationError'
  }
}

class ForbiddenError extends GraphQLError {
  constructor (message: string) {
    super(message, {
      extensions: { code: 'FORBIDDEN' }
    })
    this.name = 'ForbiddenError'
  }
}

class ApolloError extends GraphQLError {
  constructor (message: string) {
    super(message, {
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    })
    this.name = 'ApolloError'
  }
}

export const adaptResolver = async (controller: Controller, args?: any, context?: any): Promise<any> => {
  const request = {
    ...(args || {}),
    accountId: context?.req?.accountId
  }
  const httpResponse = await controller.handle(request)
  switch (httpResponse.statusCode) {
    case 200:
    case 204: return httpResponse.body
    case 400: throw new UserInputError(httpResponse.body.message)
    case 401: throw new AuthenticationError(httpResponse.body.message)
    case 403: throw new ForbiddenError(httpResponse.body.message)
    default: throw new ApolloError(httpResponse.body.message)
  }
}
