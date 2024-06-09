import { logger } from '../config/logger';
import {
  constructContainerName,
  constructRandomPorts,
  constructURL,
  retrieveRepoName,
} from '../utils/helper';
import hostService from '../services/host.service';
import dockerService from '../services/docker.service';
import { containerSchema, hostSchema } from '../schema';
const createHost = async (req, res) => {
  const { value, error } = hostSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { githubUrl, buildCommand, startCommand, servicePort = 3000 } = value;
  try {
    const [err, ports] = await hostService.getExistingPorts();

    if (err) {
      return res.status(500).json({
        status: false,
        message: `Error getting existing ports`,
      });
    }

    const availablePorts = constructRandomPorts(ports);

    if (!availablePorts) {
      return res.status(400).json({
        status: false,
        message: 'No available ports',
      });
    }

    try {
      const [err, host] = await dockerService.constructDocker({
        githubUrl,
        buildCommand,
        startCommand,
        port: availablePorts,
        servicePort,
      });

      if (err) {
        return res.status(500).json({
          status: false,
          message: `Error constructing docker - ${err}`,
        });
      }

      const repoName = retrieveRepoName(githubUrl);
      const containerName = constructContainerName(repoName, availablePorts);

      const newHost = await hostService.create({
        githubUrl,
        containerName,
        port: availablePorts,
      });

      if (newHost[0]) {
        logger.error('Error creating host', newHost[0]);
        return res.status(500).json({
          status: false,
          message: `Error creating host - ${newHost[0]}`,
        });
      }

      return res.status(200).json({
        status: true,
        message: 'Container created successfully',
        host,
      });
    } catch (error) {
      logger.error('Error creating container', error);
      return res.status(500).json({
        status: false,
        message: `Error creating container - ${error}`,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Error creating container - ${error}`,
    });
  }
};

const getHostByContainerName = async (req, res) => {
  const { error, value } = containerSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { containerName } = value;
  try {
    const [err, host] = await hostService.getHostByContainerName(containerName);
    if (err) {
      return res.status(500).json({
        status: false,
        message: `Error getting host by container id - ${err}`,
      });
    }
    logger.info('Host found by container id', host);
    const url = constructURL(host.port);
    return res.status(200).json({
      status: true,
      host,
      url,
    });
  } catch (error) {
    logger.error('Error getting host by container id', error);
    return res.status(500).json({
      status: false,
      message: `Error getting host by container id - ${error}`,
    });
  }
};

export default { createHost, getHostByContainerName };
