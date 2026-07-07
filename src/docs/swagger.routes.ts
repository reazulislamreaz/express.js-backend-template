import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi.js';

const router = Router();

const swaggerOptions = {
  explorer: true,
  customSiteTitle: 'Express Template API Docs',
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 32px 0; }
    .swagger-ui .scheme-container { box-shadow: none; border: 1px solid #e5e7eb; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    operationsSorter: 'method',
    tagsSorter: 'alpha',
  },
};

router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiDocument);
});

router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(openApiDocument, swaggerOptions));

export default router;
