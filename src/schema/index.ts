import * as joi from 'joi';
export const hostSchema = joi.object({
  githubUrl: joi.string().uri().required(),
  buildCommand: joi.string().required(),
  startCommand: joi.string().required(),
});

export const containerSchema = joi.object({
  containerId: joi.string().required(),
});
