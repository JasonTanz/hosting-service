import * as joi from 'joi';
export const hostSchema = joi.object({
  githubUrl: joi.string().uri().required(),
  buildCommand: joi.string().optional(),
  startCommand: joi.string().optional(),
  servicePort: joi.number().optional(),
});

export const containerSchema = joi.object({
  containerName: joi.string().required(),
});
