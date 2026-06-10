import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TaskGo API",
      version: "1.0.0",
      description: "TaskGo Home Service Booking Platform API",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/modules/**/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
