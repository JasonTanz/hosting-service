import { ServiceResponse } from '../@types/common';
import { THost, THostPayload } from '../@types/host';
import { logger } from '../config/logger';
import db from '../models';

const getExistingPorts = async (): Promise<ServiceResponse<number[]>> => {
  try {
    const ports = await db.hosts.findAll({
      attributes: ['port'],
    });

    logger.info('Ports found in database', ports);
    return [null, ports];
  } catch (error) {
    logger.error('Error getting ports from database', error);
    return [error, null];
  }
};

const create = async (
  payload: THostPayload,
): Promise<ServiceResponse<THost>> => {
  try {
    const host = await db.hosts.create(payload);
    logger.info('Host created successfully', host);
    return [null, host];
  } catch (error) {
    logger.error('Error creating host', error);
    return [error, null];
  }
};

const getHostByRepoUrl = async (
  githubUrl: string,
): Promise<ServiceResponse<THost>> => {
  try {
    const host = await db.hosts.findOne({
      where: { githubUrl },
    });

    logger.info('Looking for hosts', host);
    return [null, host];
  } catch (error) {
    logger.error('Error getting host by repo url', error);
    return [error, null];
  }
};

const getHostByContainerName = async (
  containerName: string,
): Promise<ServiceResponse<THost>> => {
  try {
    const host = await db.hosts.findOne({
      where: { containerName },
    });

    logger.info('Host found by container id', host);
    return [null, host];
  } catch (error) {
    logger.error('Error getting host by container id', error);
    return [error, null];
  }
};

export default {
  getExistingPorts,
  create,
  getHostByContainerName,
  getHostByRepoUrl,
};
