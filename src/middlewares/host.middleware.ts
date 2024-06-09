import hostService from '../services/host.service';
import { isNull } from 'lodash';
import { logger } from '../config/logger';
import { constructURL } from '../utils/helper';
import dockerService from '../services/docker.service';
import { hostSchema } from '../schema';

const getExistingHost = async (req, res, next) => {
  const { value, error } = hostSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { githubUrl, buildCommand, startCommand, servicePort = 3000 } = value;
  try {
    const [err, host] = await hostService.getHostByRepoUrl(githubUrl);
    if (err) {
      return res.status(500).json({
        status: false,
        message: `Error getting host by repo url - ${err}`,
      });
    }
    if (!isNull(host)) {
      logger.info('Host found by repo url', host);

      const existingContainer = await dockerService.getContainerByName(
        host.containerName,
      );

      if (existingContainer?.container.id) {
        logger.info('Existing container found', existingContainer);
        if (existingContainer.data.State.Status === 'running') {
          return res.status(200).json({
            status: true,
            message: 'Existing container found',
            url: constructURL(host.port),
            containerName: host.containerName,
          });
        }
        await existingContainer?.container.start();
        return res.status(200).json({
          status: true,
          message: 'Existing container found',
          url: constructURL(host.port),
          containerName: host.containerName,
        });
      }
      logger.info('Existing container not found, creating new container');
      const [err, container] = await dockerService.constructDocker({
        githubUrl,
        buildCommand,
        startCommand,
        port: host.port,
        servicePort,
      });

      if (err) {
        return res.status(500).json({
          status: false,
          message: `Error starting container - ${err}`,
        });
      }

      return res.status(200).json({
        status: true,
        message: 'Existing container found',
        container,
      });
    }
    next();
  } catch (error) {
    logger.error('Error getting host by repo url', error);
    return res.status(500).json({
      status: false,
      message: `Error getting host by repo url - ${error}`,
    });
  }
};

export default { getExistingHost };
