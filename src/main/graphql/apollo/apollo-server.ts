import { authDirectiveTransformer } from "@/main/graphql/directives";
import resolvers from "@/main/graphql/resolvers";
import typeDefs from "@/main/graphql/type-defs";

import { ApolloServer, ApolloServerPlugin, BaseContext } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import { Express, json, Request } from "express";
import { GraphQLError, GraphQLFormattedError } from "graphql";
import { Server } from "http";

export interface ApolloContext extends BaseContext {
  req?: Request;
}

let schema = makeExecutableSchema({ resolvers, typeDefs });
schema = authDirectiveTransformer(schema);

const formatError = (
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError => {
  if (error instanceof GraphQLError) {
    const extensions = error.extensions || {};
    if (extensions.code === "BAD_USER_INPUT") {
      return { ...formattedError, extensions: { ...extensions, http: { status: 400 } } };
    }
    if (extensions.code === "UNAUTHENTICATED") {
      return { ...formattedError, extensions: { ...extensions, http: { status: 401 } } };
    }
    if (extensions.code === "FORBIDDEN") {
      return { ...formattedError, extensions: { ...extensions, http: { status: 403 } } };
    }
  }
  return formattedError;
};

const httpStatusPlugin: ApolloServerPlugin<ApolloContext> = {
  async requestDidStart() {
    return {
      async willSendResponse({ response }) {
        const body = response.body;
        if (!body || body.kind !== "single" || !body.singleResult.errors?.length) {
          return;
        }
        const hasAccessDenied = body.singleResult.errors.some((error) => {
          const extensions = error.extensions as { http?: { status?: number } } | undefined;
          return extensions?.http?.status === 403 && error.message === "Access denied";
        });
        if (hasAccessDenied && (response.http.status == null || response.http.status === 200)) {
          response.http.status = 403;
        }
      },
    };
  },
};

export const setupApolloServer = (httpServer: Server): ApolloServer<ApolloContext> =>
  new ApolloServer<ApolloContext>({
    schema,
    formatError,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), httpStatusPlugin],
  });

export const applyApolloMiddleware = async (
  app: Express,
  httpServer: Server,
  path: string = "/graphql"
): Promise<void> => {
  const server = setupApolloServer(httpServer);
  await server.start();
  app.use(
    path,
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<ApolloContext> => ({ req }),
    })
  );
};
